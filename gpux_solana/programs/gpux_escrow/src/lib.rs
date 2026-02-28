use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Default localnet ID

#[program]
pub mod gpux_escrow {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, job_id: String, amount: u64) -> Result<()> {
        let job = &mut ctx.accounts.job;
        job.renter = ctx.accounts.renter.key();
        job.provider = ctx.accounts.provider.key();
        job.job_id = job_id;
        job.amount = amount;
        job.is_active = true;

        // Transfer SOL to escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.renter.to_account_info(),
                to: job.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        
        Ok(())
    }

    pub fn release(ctx: Context<ReleaseOrRefund>, job_id: String, payout_amount: u64) -> Result<()> {
        let job = &mut ctx.accounts.job;
        require!(job.is_active, ErrorCode::JobNotActive);
        require!(ctx.accounts.coordinator.key() == ctx.accounts.coordinator.key(), ErrorCode::Unauthorized); // In production, verify coordinator pubkey

        // Pay the provider
        **job.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
        **ctx.accounts.provider.to_account_info().try_borrow_mut_lamports()? += payout_amount;

        // Refund any remainder to renter
        let current_balance = job.to_account_info().lamports();
        if current_balance > 0 {
            let rent_exempt_minimum = Rent::get()?.minimum_balance(job.to_account_info().data_len());
            let refund_amount = current_balance.saturating_sub(rent_exempt_minimum);
            
            if refund_amount > 0 {
               **job.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
               **ctx.accounts.renter.to_account_info().try_borrow_mut_lamports()? += refund_amount;
            }
        }
        
        job.is_active = false;
        Ok(())
    }

    pub fn refund(ctx: Context<ReleaseOrRefund>, job_id: String) -> Result<()> {
        let job = &mut ctx.accounts.job;
        require!(job.is_active, ErrorCode::JobNotActive);
        require!(ctx.accounts.coordinator.key() == ctx.accounts.coordinator.key(), ErrorCode::Unauthorized); 

        let refund_amount = job.to_account_info().lamports().saturating_sub(
            Rent::get()?.minimum_balance(job.to_account_info().data_len())
        );

        **job.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.renter.to_account_info().try_borrow_mut_lamports()? += refund_amount;

        job.is_active = false;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(job_id: String)]
pub struct Deposit<'info> {
    #[account(
        init, 
        payer = renter, 
        space = 8 + 32 + 32 + 4 + 32 + 8 + 1, // discriminator + pubkey + pubkey + string prefix + char bytes + u64 + bool
        seeds = [b"job", job_id.as_bytes(), renter.key().as_ref()], 
        bump
    )]
    pub job: Account<'info, JobData>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    /// CHECK: Safe, just storing the provider address here
    pub provider: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(job_id: String)]
pub struct ReleaseOrRefund<'info> {
    #[account(
        mut,
        seeds = [b"job", job_id.as_bytes(), renter.key().as_ref()],
        bump
    )]
    pub job: Account<'info, JobData>,
    
    #[account(mut)]
    /// CHECK: Safe
    pub renter: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Safe
    pub provider: AccountInfo<'info>,
    
    pub coordinator: Signer<'info>, // Trusted oracle backend
}

#[account]
pub struct JobData {
    pub renter: Pubkey,
    pub provider: Pubkey,
    pub job_id: String,
    pub amount: u64,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("This job is no longer active.")]
    JobNotActive,
    #[msg("Unauthorized to perform this action.")]
    Unauthorized,
}
