import React, { useState } from 'react';

export default function AdminPanel({ curriculum, setCurriculum }) {
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newSubtopics, setNewSubtopics] = useState('');

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!newGroupTitle) return;

    const subtopicArray = newSubtopics.split(',').map((s) => ({
      name: s.trim(),
      description: "Custom admin-added curriculum topic."
    })).filter(s => s.name);

    const newGroup = {
      id: `group-${curriculum.length + 1}`,
      groupNumber: curriculum.length + 1,
      title: newGroupTitle,
      subtopics: subtopicArray
    };

    setCurriculum([...curriculum, newGroup]);
    setNewGroupTitle('');
    setNewSubtopics('');
  };

  const handleDeleteGroup = (id) => {
    setCurriculum(curriculum.filter((item) => item.id !== id));
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl max-w-4xl mx-auto my-6 border border-slate-800 text-left">
      <h2 className="text-2xl font-bold mb-4 text-amber-500">Admin Panel - Course Management</h2>

      <form onSubmit={handleAddGroup} className="mb-8 p-4 bg-slate-800 rounded-lg space-y-4">
        <h3 className="font-semibold text-lg text-slate-200">Add New Curriculum Group</h3>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Group Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Digital Illustration & Painting"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Subtopics (separated by comma)</label>
          <input
            type="text"
            placeholder="e.g. Layers, Brushes, Blending Modes"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
            value={newSubtopics}
            onChange={(e) => setNewSubtopics(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold text-white">
          + Add Group
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-slate-200">Existing Groups</h3>
        {curriculum.map((group) => (
          <div key={group.id} className="p-4 bg-slate-800 rounded-lg flex justify-between items-start border border-slate-700">
            <div>
              <h4 className="font-bold text-amber-400">GROUP {group.groupNumber}: {group.title}</h4>
              <p className="text-sm text-slate-400 mt-1">
                {group.subtopics.map(sub => sub.name).join(' • ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteGroup(group.id)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded text-white"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}