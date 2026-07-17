import { useCallback, useRef, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: '',
  message: '',
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState(DEFAULT_STATE);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState(DEFAULT_STATE);
  }, []);

  return { confirmState: state, confirm, handleConfirm, handleCancel };
}