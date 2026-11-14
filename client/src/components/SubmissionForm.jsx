import React, { useState } from 'react';

export default function SubmissionForm({ curriculumData }) {
  const [formType, setFormType] = useState('assignment'); // 'assignment' or 'scholarship'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    selectedGroup: '',
    selectedTopic: '',
    portfolioUrl: '',
    statement: '',
    file: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submissionContent = `
=== BECOMING AN ARTIST - ${formType.toUpperCase()} SUBMISSION ===
Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
${formType === 'assignment' ? `Course Group: ${formData.selectedGroup}\nTopic: ${formData.selectedTopic}` : ''}
${formType === 'scholarship' ? `Portfolio Link: ${formData.portfolioUrl}\nArtist Statement: ${formData.statement}` : ''}
Date: ${new Date().toLocaleDateString()}
    `;

    alert('Submission Generated Successfully!\n\n' + submissionContent);
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl max-w-2xl mx-auto my-6 shadow-lg border border-slate-800">
      <div className="flex space-x-4 mb-6 border-b border-slate-700 pb-3">
        <button
          type="button"
          onClick={() => setFormType('assignment')}
          className={`px-4 py-2 rounded-lg font-semibold ${formType === 'assignment' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Assignment Submission
        </button>
        <button
          type="button"
          onClick={() => setFormType('scholarship')}
          className={`px-4 py-2 rounded-lg font-semibold ${formType === 'scholarship' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Scholarship Application
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-sm mb-1 text-slate-300">Full Name</label>
          <input
            type="text"
            required
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Email</label>
            <input
              type="email"
              required
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Phone</label>
            <input
              type="tel"
              required
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {formType === 'assignment' && (
          <>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Select Course Group</label>
              <select
                required
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
                onChange={(e) => setFormData({ ...formData, selectedGroup: e.target.value })}
              >
                <option value="">-- Select Group --</option>
                {curriculumData && curriculumData.map((g) => (
                  <option key={g.id} value={g.title}>Group {g.groupNumber}: {g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Specific Topic / Subtopic</label>
              <input
                type="text"
                placeholder="e.g. Chiaroscuro or Canon of Proportions"
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
                onChange={(e) => setFormData({ ...formData, selectedTopic: e.target.value })}
              />
            </div>
          </>
        )}

        {formType === 'scholarship' && (
          <>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Portfolio Link (Google Drive / ArtStation / Instagram)</label>
              <input
                type="url"
                required
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Why do you need this scholarship?</label>
              <textarea
                rows="4"
                required
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              ></textarea>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm mb-1 text-slate-300">Attach Artwork Image / Document</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white hover:file:bg-amber-700"
            onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-white transition-all"
        >
          Submit Application
        </button>
      </form>
    </div>
  );
}