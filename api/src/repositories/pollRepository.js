const db = require('../config/db');

class PollRepository {
    async create(question, options, streamId) {
        await db.query('BEGIN');
        try {
            const pollResult = await db.query(
                'INSERT INTO polls (question, stream_id) VALUES ($1, $2) RETURNING *',
                [question, streamId]
            );
            const poll = pollResult.rows[0];

            for (const option of options) {
                await db.query(
                    'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)',
                    [poll.id, option]
                );
            }

            await db.query('COMMIT');
            return poll;
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    }

    async getActive(streamId) {
        const useStreamId = (streamId && streamId !== '' && streamId !== 'null') ? streamId : null;
        const query = `
            SELECT p.*, 
                json_agg(json_build_object('id', o.id, 'text', o.option_text)) as options
            FROM polls p
            LEFT JOIN poll_options o ON p.id = o.poll_id
            WHERE p.is_active = true AND ${useStreamId ? '(p.stream_id = $1 OR p.stream_id IS NULL)' : 'p.stream_id IS NULL'}
            GROUP BY p.id
            ORDER BY p.stream_id ASC NULLS LAST, p.created_at DESC
            LIMIT 1;
        `;
        const result = await db.query(query, useStreamId ? [useStreamId] : []);
        return result.rows[0];
    }

    async getAll() {
        const query = `
            SELECT p.*, s.language as stream_language 
            FROM polls p 
            LEFT JOIN streams s ON p.stream_id = s.id 
            ORDER BY p.created_at DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async getById(id) {
        const query = `
            SELECT p.*, 
                json_agg(json_build_object('id', o.id, 'text', o.option_text)) as options
            FROM polls p
            LEFT JOIN poll_options o ON p.id = o.poll_id
            WHERE p.id = $1
            GROUP BY p.id;
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async vote(pollId, userId, optionId) {
        const query = `
            INSERT INTO poll_votes (poll_id, user_id, option_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await db.query(query, [pollId, userId, optionId]);
        return result.rows[0];
    }

    async getUserVote(pollId, userId) {
        const query = 'SELECT * FROM poll_votes WHERE poll_id = $1 AND user_id = $2';
        const result = await db.query(query, [pollId, userId]);
        return result.rows[0];
    }

    async getResults(pollId) {
        const query = `
            SELECT o.id, o.option_text, COUNT(v.id)::int as votes
            FROM poll_options o
            LEFT JOIN poll_votes v ON o.id = v.option_id
            WHERE o.poll_id = $1
            GROUP BY o.id, o.option_text;
        `;
        const result = await db.query(query, [pollId]);
        return result.rows;
    }

    async updateStatus(id, isActive, showResults) {
        const query = `
            UPDATE polls 
            SET is_active = $1, show_results = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await db.query(query, [isActive, showResults, id]);
        return result.rows[0];
    }

    async getVotesReport() {
        const query = `
            SELECT 
                pv.id,
                pv.created_at,
                u.name as user_name,
                u.email as user_email,
                p.question as poll_question,
                po.option_text as choice_text,
                s.language as stream_language,
                s.title as stream_title
            FROM poll_votes pv
            JOIN users u ON pv.user_id = u.id
            JOIN polls p ON pv.poll_id = p.id
            JOIN poll_options po ON pv.option_id = po.id
            LEFT JOIN streams s ON p.stream_id = s.id
            ORDER BY pv.created_at DESC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async deactivateAll(streamId) {
        const useStreamId = (streamId && streamId !== '' && streamId !== 'null') ? streamId : null;
        if (useStreamId) {
            // Deactivate this stream's polls AND global polls to avoid clashing
            await db.query('UPDATE polls SET is_active = false WHERE stream_id = $1 OR stream_id IS NULL', [useStreamId]);
        } else {
            // Deactivate EVERYTHING if activating a global poll
            await db.query('UPDATE polls SET is_active = false');
        }
    }

    async delete(id) {
        await db.query('DELETE FROM polls WHERE id = $1', [id]);
    }
}

module.exports = new PollRepository();
