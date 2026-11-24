// Turns NewsItem rows into the JSON the app shows. The "open" link is built here so it always matches the current course slug.
import { Lesson, Course } from './models/index.js';

const isHttp = (u) => /^https?:\/\//i.test(String(u || ''));

export async function serializeNews(items) {
  const list = Array.isArray(items) ? items : [items];
  const lessonIds = list.filter((n) => n.linkKind === 'lesson' && n.lesson).map((n) => n.lesson);
  const lessons = lessonIds.length ? await Lesson.find({ _id: { $in: lessonIds } }, 'course').lean() : [];
  const lessonCourse = new Map(lessons.map((l) => [String(l._id), String(l.course)]));
  const courseIds = [...new Set([...list.filter((n) => n.linkKind === 'course' && n.course).map((n) => String(n.course)), ...lessonCourse.values()])];
  const courses = courseIds.length ? await Course.find({ _id: { $in: courseIds } }, 'slug isPublished').lean() : [];
  const slugOf = new Map(courses.filter((c) => c.isPublished).map((c) => [String(c._id), c.slug]));

  return list.map((n) => {
    let link = '';
    let linkKind = n.linkKind || 'none';
    if (linkKind === 'lesson') {
      const slug = slugOf.get(lessonCourse.get(String(n.lesson)));
      link = slug ? `/courses/${slug}/lessons/${n.lesson}` : '';
    } else if (linkKind === 'course') {
      const slug = slugOf.get(String(n.course));
      link = slug ? `/courses/${slug}` : '';
    } else if (linkKind === 'url') {
      link = isHttp(n.linkUrl) ? n.linkUrl : '';
    }
    if (!link) linkKind = 'none';
    return {
      id: String(n._id), title: n.title, titleAm: n.titleAm || '', summary: n.summary || '', summaryAm: n.summaryAm || '',
      body: n.body || '', bodyAm: n.bodyAm || '', imageUrl: n.image?.url || '', image: n.image?.url ? { url: n.image.url, publicId: n.image.publicId, account: n.image.account || 'env', resourceType: 'image' } : null,
      link, linkKind, linkUrl: n.linkUrl || '', lessonId: n.lesson ? String(n.lesson) : '', courseId: n.course ? String(n.course) : '',
      isActive: !!n.isActive, createdAt: n.createdAt,
    };
  });
}
