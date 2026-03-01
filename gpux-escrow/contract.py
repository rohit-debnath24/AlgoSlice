from algopy import ARC4Contract, Global, Txn, UInt64, arc4, gtxn, itxn, Account

class EscrowContract(ARC4Contract):
    """
    Decentralized GPU Rental Escrow
    Tokens are deposited by the Renter and released to the Provider
    by the Coordinator (acting as an Oracle) when the job is done.
    """

    def __init__(self) -> None:
        self.coordinator = Global.creator_address

    @arc4.abimethod
    def deposit(self, job_id: arc4.String, payment: gtxn.PaymentTransaction) -> None:
        """
        Renter calls this with a grouped Payment txn.
        """
        assert payment.receiver == Global.current_application_address, "Payment must be to Escrow"
        assert payment.amount > 0, "Amount must be greater than 0"

    @arc4.abimethod
    def release(self, provider: Account, amount: UInt64) -> None:
        """
        The Coordinator calls this to release funds to the Provider based on actual runtime.
        """
        assert Txn.sender == self.coordinator, "Only the Coordinator can release funds"
        
        # Send payment to the provider
        itxn.Payment(
            receiver=provider,
            amount=amount,
            fee=0,
        ).submit()

    @arc4.abimethod
    def refund(self, renter: Account, amount: UInt64) -> None:
        """
        The Coordinator calls this to refund the Renter if the Provider's node goes offline.
        """
        assert Txn.sender == self.coordinator, "Only the Coordinator can process refunds"
        
        itxn.Payment(
            receiver=renter,
            amount=amount,
            fee=0,
        ).submit()
