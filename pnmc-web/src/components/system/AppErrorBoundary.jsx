import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error no controlado en la aplicación:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center px-6">
          <div className="max-w-xl text-center">
            <p className="font-alternate text-xs uppercase tracking-[0.2em] text-slate-500">PNMC</p>
            <h1 className="mt-3 font-alternate text-2xl md:text-3xl font-bold uppercase text-[#291242]">
              No pudimos cargar esta sección
            </h1>
            <p className="mt-4 font-nunito text-sm leading-relaxed text-slate-600">
              Ocurrió un error inesperado. Puedes recargar la página y volver a intentarlo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#291242] px-5 py-3 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#3f1f63] transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { AppErrorBoundary };
