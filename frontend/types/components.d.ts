// Type definitions for custom UI components

declare module '@/components/ui/Alert' {
  import { ComponentType } from 'react';
  
  interface AlertProps {
    variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
    className?: string;
    children: React.ReactNode;
  }
  
  interface AlertTitleProps {
    className?: string;
    children: React.ReactNode;
  }
  
  interface AlertDescriptionProps {
    className?: string;
    children: React.ReactNode;
  }
  
  export const Alert: ComponentType<AlertProps>;
  export const AlertTitle: ComponentType<AlertTitleProps>;
  export const AlertDescription: ComponentType<AlertDescriptionProps>;
}

declare module '@/components/ui/Button' {
  import { ComponentType, ButtonHTMLAttributes } from 'react';
  
  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
  
  export const Button: ComponentType<ButtonProps>;
  export const buttonVariants: any;
}
