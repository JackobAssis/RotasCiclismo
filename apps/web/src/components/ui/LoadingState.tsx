interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingState({ message = 'Carregando...', fullPage = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-dark-950">{content}</div>
    );
  }

  return <div className="flex items-center justify-center py-16">{content}</div>;
}
