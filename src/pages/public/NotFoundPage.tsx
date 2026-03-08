import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page not found</p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-secondary text-white rounded-lg hover:bg-blue-600"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
