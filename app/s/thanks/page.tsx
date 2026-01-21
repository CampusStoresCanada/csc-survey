export default function ThanksPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-600 mb-4">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
        <p className="text-gray-600 text-lg mb-6">
          Your feedback has been submitted successfully.
        </p>
        <p className="text-gray-500">
          We appreciate you taking the time to share your thoughts. Your input helps us make the conference better every year.
        </p>
      </div>
    </div>
  );
}
