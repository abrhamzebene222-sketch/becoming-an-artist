import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/**
 * Student & Public Category Tree Component
 * Supports infinitely nested groups (major groups, sub-groups, sub-sub-groups...) with expandable dropdown arrows 
 * so students can explore the hierarchy smoothly.
 */
export default function StudentCategoryTree({ roots, selectedId, onSelectGroup, onSelectCourse, forceOpen = false }) {
  return (
    <ul role="tree" className="flex flex-col text-sm gap-1">
      {roots.map((node) => (
        <TreeNode 
          key={node.id} 
          node={node} 
          depth={0} 
          selectedId={selectedId} 
          onSelectGroup={onSelectGroup} 
          onSelectCourse={onSelectCourse} 
          forceOpen={forceOpen}
        />
      ))}
    </ul>
  );
}

function TreeNode({ node, depth, selectedId, onSelectGroup, onSelectCourse, forceOpen }) {
  const { t, loc } = useI18n();
  // By default, expand major groups or keep them collapsible
  const [isOpen, setIsOpen] = useState(depth === 0 || !!forceOpen);
  useEffect(() => { if (forceOpen) setIsOpen(true); }, [forceOpen]); // searching → show what matched
  
  const hasSubGroups = node.children && node.children.length > 0;
  const hasCourses = (node.ownCourses && node.ownCourses.length > 0) || (node.courses && node.courses.length > 0);
  const hasChildren = hasSubGroups || hasCourses;

  const isActive = selectedId === node.id;
  const name = loc(node, 'title');
  const padLeft = { paddingLeft: `${depth * 16 + 12}px` };
  const coursesList = node.ownCourses || node.courses || [];

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} className="flex flex-col">
      <div 
        className={`flex items-center gap-2 rounded-xl pr-2 transition-colors ${
          isActive ? 'bg-teal-active text-white font-semibold' : 'hover:bg-ink text-muted-soft'
        }`} 
        style={padLeft}
      >
        {/* Expand/Collapse Arrow Button */}
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)} 
          disabled={!hasChildren}
          aria-label={isOpen ? t('explorer.collapse', { name }) : t('explorer.expand', { name })}
          className="w-7 h-9 shrink-0 grid place-items-center text-muted disabled:opacity-20 hover:text-mint"
        >
          <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={16} />
        </button>

        {/* Group Selection Button */}
        <button 
          type="button" 
          onClick={() => onSelectGroup(node)} 
          className="flex-1 min-w-0 flex items-center gap-2.5 py-2.5 text-left"
        >
          <Icon name="folder" size={16} className={depth === 0 ? 'text-teal-soft shrink-0' : 'text-muted shrink-0'} />
          <span className="truncate flex-1">{name}</span>
          {node.isFree ? (
            <span className="text-[11px] bg-teal text-[#0B1312] px-2 py-0.5 rounded-full font-bold shrink-0">{t('common.free')}</span>
          ) : node.groupPriceEtb ? (
            <span className="text-[11px] text-teal-soft shrink-0">{node.groupPriceEtb} ETB</span>
          ) : null}
        </button>
      </div>

      {/* Expanded Sub-groups and Courses Tree */}
      {isOpen && hasChildren && (
        <ul role="group" className="relative flex flex-col gap-1 mt-1 pl-3 border-l border-line ml-4">
          {/* Render Sub-groups recursively (ማለቂያ የሌለው ኔስቲንግ እንዲኖር ራሱን በራሱ ይጠራል) */}
          {hasSubGroups && node.children.map((subGroup) => (
            <TreeNode 
              key={subGroup.id} 
              node={subGroup} 
              depth={depth + 1} 
              selectedId={selectedId} 
              onSelectGroup={onSelectGroup} 
              onSelectCourse={onSelectCourse} 
              forceOpen={forceOpen}
            />
          ))}

          {/* Render Courses inside this group */}
          {coursesList.map((course) => {
            const isCourseActive = selectedId === course.id;
            return (
              <li key={course.id} role="treeitem">
                <button 
                  type="button" 
                  onClick={() => onSelectCourse(course)} 
                  className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left transition-colors ${
                    isCourseActive ? 'bg-teal-active text-white font-semibold' : 'hover:bg-ink text-muted'
                  }`}
                >
                  <Icon name="play" size={13} className="text-teal-soft shrink-0" />
                  <span className="truncate flex-1">
                    {loc(course, 'title')}
                    {course.isFree && <span className="text-xs text-teal-soft"> · {t('common.free')}</span>}
                  </span>
                  <span className="text-xs text-muted-dim shrink-0">{course.lessons?.length || 0} lessons</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
