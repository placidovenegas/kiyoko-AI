export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectShortId?: string;
  onSuccess?: () => void;
}
