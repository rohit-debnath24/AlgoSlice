"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeComponentProps {
  label: string;
  className?: string;
}

const BadgeComponent = ({ label, className }: BadgeComponentProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: "easeInOut", type: "spring" }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
        "bg-[#69E300]/10 text-[#69E300] border border-[#69E300]/20",
        "backdrop-blur-sm shadow-[0_0_20px_rgba(105,227,0,0.1)]",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>{label}</span>
    </motion.div>
  );
};

interface PulseButtonComponentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

const PulseButtonComponent = ({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  iconPosition = "left",
  className = "",
  ...props
}: PulseButtonComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<
    Array<{
      x: number;
      y: number;
      size: number;
      id: number;
    }>
  >([]);
  const [rippleCount, setRippleCount] = useState(0);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      x,
      y,
      size,
      id: rippleCount,
    };

    setRippleEffect((prev) => [...prev, newRipple]);
    setRippleCount((prev) => prev + 1);

    setTimeout(() => {
      setRippleEffect((prev) =>
        prev.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, 1000);
  };

  const variantStyles = {
    primary: {
      background: "bg-[#69E300]",
      hover: "hover:bg-[#5bc700]",
      text: "text-black",
      glow: "rgba(105, 227, 0, 0.6)",
      ripple: "bg-white bg-opacity-30",
      shadow: "shadow-[0_0_30px_rgba(105,227,0,0.3)]",
    },
    secondary: {
      background: "bg-transparent",
      hover: "hover:bg-[#69E300]/10",
      text: "text-[#69E300]",
      glow: "rgba(105, 227, 0, 0.4)",
      ripple: "bg-[#69E300] bg-opacity-20",
      shadow: "shadow-[0_0_20px_rgba(105,227,0,0.2)]",
    },
  };

  const sizeStyles = {
    md: "text-sm px-6 py-3 rounded-lg",
    lg: "text-base px-8 h-14 rounded-full",
  };

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      className={cn(
        "relative group font-bold border select-none",
        "inline-flex items-center justify-center transition-all duration-300",
        "overflow-hidden active:scale-95",
        variantStyle.background,
        variantStyle.hover,
        variantStyle.text,
        variant === "secondary" ? "border-[#69E300]/30" : "border-transparent",
        sizeStyle,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={createRipple}
      style={{
        boxShadow: isHovered ? variantStyle.shadow : "none",
      }}
      suppressHydrationWarning
      {...props}
    >
      {rippleEffect.map((ripple) => (
        <span
          key={ripple.id}
          className={cn("absolute rounded-full", variantStyle.ripple)}
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            animation: "ripple 1s ease-out",
          }}
        />
      ))}

      {icon && iconPosition === "left" && (
        <span className={cn("inline-flex", children ? "mr-2" : "")}>
          {icon}
        </span>
      )}

      {children}

      {icon && iconPosition === "right" && (
        <span className={cn("inline-flex", children ? "ml-2" : "")}>
          {icon}
        </span>
      )}
    </button>
  );
};

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[450px] bg-transparent overflow-hidden flex items-center justify-center py-16 px-6 rounded-3xl border-2 border-[#69E300]/40"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#69E300] rounded-full blur-[120px] animate-pulse"
          style={{
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#69E300] rounded-full blur-[120px] animate-pulse"
          style={{
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(#69E300 1px, transparent 1px), linear-gradient(90deg, #69E300 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Radial gradient following mouse */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(105, 227, 0, 0.15), transparent 40%)`,
        }}
      />

      {/* Content container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <BadgeComponent label="Get Started" />
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight"
        >
          Automate your infrastructure <span className="text-[#69E300]">at the speed of thought</span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Empower your entire organization to create, audit, and deploy at the speed of thought, while ensuring security remains at the forefront.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <PulseButtonComponent
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            className="min-w-[220px]"
          >
            Request Early Access
          </PulseButtonComponent>

          <PulseButtonComponent
            variant="secondary"
            size="lg"
            icon={<Play className="w-4 h-4 fill-current" />}
            iconPosition="left"
            className="min-w-[220px]"
          >
            Watch Technical Demo
          </PulseButtonComponent>
        </motion.div>

        {/* Decorative glow elements */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#69E300] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      </motion.div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(20px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
