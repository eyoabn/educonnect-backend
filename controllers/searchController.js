const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const Material = require('../models/Material');

// ═══ UNIFIED SEARCH ═══
// GET /api/search?q=keyword&filter=all|courses|announcements|files
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = (req.query.filter || 'all').toLowerCase();

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const regex = new RegExp(q, 'i');
    const results = [];

    // ── Search Courses ───────────────────────────────────────────
    if (filter === 'all' || filter === 'courses') {
      const courses = await Course.find({ name: regex }).limit(10);
      for (const c of courses) {
        results.push({
          id: c._id.toString(),
          type: 'course',
          title: c.name,
          course: c.name,
          teacher: c.teacherName || '',
          match: `Course with ${c.students?.length || 0} students`,
        });
      }
    }

    // ── Search Announcements ─────────────────────────────────────
    if (filter === 'all' || filter === 'messages') {
      const announcements = await Announcement.find({
        $or: [{ title: regex }, { content: regex }],
      })
        .populate('authorId', 'name')
        .limit(10);

      for (const a of announcements) {
        // Only return announcements accessible to this user
        results.push({
          id: a._id.toString(),
          type: 'announcement',
          title: a.title,
          course: a.courseId?.toString() || '',
          teacher: a.authorId?.name || 'Unknown',
          match: a.content?.substring(0, 80) + (a.content?.length > 80 ? '...' : ''),
        });
      }
    }

    // ── Search Materials (files) ─────────────────────────────────
    if (filter === 'all' || filter === 'files') {
      const materials = await Material.find({ title: regex }).limit(10);
      for (const m of materials) {
        results.push({
          id: m._id.toString(),
          type: 'file',
          title: m.title,
          course: m.courseId?.toString() || '',
          teacher: '',
          match: `${m.category || 'file'} — uploaded material`,
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ msg: 'Server error during search' });
  }
};
