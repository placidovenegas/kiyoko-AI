/**
 * HeroUI v3 type extensions.
 *
 * HeroUI v3 component types are stricter than their runtime behavior.
 * We extend the root interfaces so the compiler accepts props that
 * work at runtime but aren't declared in the shipped .d.ts files.
 */

import '@heroui/react';
import 'react-aria-components';

declare module '@heroui/react' {
  // ── Input ──────────────────────────────────────────────
  interface InputRootProps {
    isDisabled?: boolean;
    onValueChange?: (value: string) => void;
    autoFocus?: boolean;
  }

  // ── TextArea ───────────────────────────────────────────
  interface TextAreaRootProps {
    isDisabled?: boolean;
    onValueChange?: (value: string) => void;
    minRows?: number;
    maxRows?: number;
    [key: string]: unknown;
  }

  // ── Button ─────────────────────────────────────────────
  interface ButtonRootProps {
    color?: string;
    variant?: string;
    startContent?: React.ReactNode;
    endContent?: React.ReactNode;
    [key: string]: unknown;
  }

  // ── DropdownItem ───────────────────────────────────────
  interface DropdownItemProps {
    startContent?: React.ReactNode;
    endContent?: React.ReactNode;
    color?: string;
    href?: string;
  }

  // ── DropdownSection ────────────────────────────────────
  interface DropdownSectionProps {
    title?: string;
  }

  // ── Select ─────────────────────────────────────────────
  interface SelectRootProps {
    isDisabled?: boolean;
    size?: string;
    labelPlacement?: string;
    [key: string]: unknown;
  }

  // ── Tooltip ────────────────────────────────────────────
  interface TooltipTriggerComponentProps {
    content?: string;
    placement?: string;
    children?: React.ReactNode;
  }

  // ── Avatar ─────────────────────────────────────────────
  interface AvatarRootProps {
    src?: string;
    alt?: string;
    name?: string;
    className?: string;
    [key: string]: unknown;
  }

  // ── Slider ─────────────────────────────────────────────
  interface SliderProps {
    formatValue?: (value: number) => string;
    showValue?: boolean;
    color?: string;
    label?: string;
  }

  interface SliderRootProps {
    value?: number | number[];
    defaultValue?: number | number[];
    onChange?: (value: number | number[]) => void;
    minValue?: number;
    maxValue?: number;
    step?: number;
    color?: string;
    size?: string;
    label?: string;
    showValue?: boolean;
    formatValue?: (value: number) => string;
    className?: string;
    'aria-label'?: string;
    [key: string]: unknown;
  }

  // ── Modal / Dialog ─────────────────────────────────────
  interface ModalRootProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    placement?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  interface ModalDialogProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }

  // ── Progress ───────────────────────────────────────────
  interface ProgressProps {
    color?: string;
  }

  interface ProgressBarRootProps {
    value?: number;
    maxValue?: number;
    label?: string;
    color?: string;
    size?: string;
    className?: string;
    [key: string]: unknown;
  }

  // ── Switch ─────────────────────────────────────────────
  interface SwitchProps {
    isDisabled?: boolean;
    isSelected?: boolean;
    onValueChange?: (value: boolean) => void;
    size?: string;
    color?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  // ── Tooltip ─────────────────────────────────────────────
  interface TooltipRootProps {
    content?: string;
    placement?: string;
    children?: React.ReactNode;
    delay?: number;
    closeDelay?: number;
    [key: string]: unknown;
  }

  // ── Select ─────────────────────────────────────────────
  interface SelectRootProps {
    isDisabled?: boolean;
    selectedKeys?: string[];
    onSelectionChange?: (keys: Key | null) => void;
    labelPlacement?: string;
    placeholder?: string;
    'aria-label'?: string;
    label?: string;
    size?: string;
    className?: string;
    [key: string]: unknown;
  }
}

declare module 'react-aria-components' {
  interface TooltipTriggerComponentProps {
    content?: string;
    placement?: string;
    children?: React.ReactNode;
    delay?: number;
    closeDelay?: number;
    [key: string]: unknown;
  }
}
