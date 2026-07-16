import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 font-sans">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl w-full text-center border border-gray-100 animate-fade-in-up">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Eyvah! Bir şeyler ters gitti.</h1>
            <p className="text-gray-500 mb-8 text-sm">
              Sistemsel bir hata oluştu ve sayfa düzgün yüklenemedi. Merak etmeyin, bu geçici bir durum olabilir. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <div className="mb-8 text-left bg-gray-50 p-4 rounded-xl overflow-auto border border-gray-200 text-xs text-red-600 font-mono">
                <p className="font-bold mb-2">{this.state.error.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}

            <button 
              onClick={this.handleReload}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-red-200 flex items-center justify-center gap-2 mx-auto w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
