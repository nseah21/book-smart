import React from "react";

const SummaryComponent = ({ summary, onReset }) => {
  return (
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Email Summary</h2>
        <textarea
          className="w-full p-4 border rounded-md text-gray-700 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={summary}
          disabled
          rows={10}
          readOnly
        />
        <div className="mt-4 flex justify-center">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={onReset}
          >
            Summarize Another Email
          </button>
        </div>
      </div>
  );
};

export default SummaryComponent;
