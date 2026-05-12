export default function ModalOverlay({ children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center z-50">
      {children}
    </div>
  );
}