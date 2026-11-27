<?php

namespace App\Models;

use App\Enums\ContentSource;
use App\Enums\NoteKind;
use App\Models\Concerns\HasTags;
use Database\Factories\NoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A Markdown note, always private to its author. topic_id is optional (unfiled notes).
 *
 * @property NoteKind $kind
 * @property ContentSource $source
 */
#[Fillable(['topic_id', 'title', 'kind', 'body', 'is_pinned'])]
class Note extends Model
{
    /** @use HasFactory<NoteFactory> */
    use HasFactory, HasTags, SoftDeletes;

    /** InnoDB ignores shorter words (innodb_ft_min_token_size = 3). */
    private const MIN_FULLTEXT_WORD = 3;

    /**
     * InnoDB's default stopword list (INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD). These are never indexed,
     * so a required "+the*" term would match nothing; they are dropped from the query.
     */
    private const STOPWORDS = [
        'a', 'about', 'an', 'are', 'as', 'at', 'be', 'by', 'com', 'de', 'en', 'for', 'from', 'how', 'i', 'in',
        'is', 'it', 'la', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'who',
        'will', 'with', 'und', 'www',
    ];

    /**
     * Mirrors the column defaults so a freshly created note has them in memory (strict mode).
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'kind' => 'general',
        'is_pinned' => false,
        'source' => 'manual',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => NoteKind::class,
            'source' => ContentSource::class,
            'is_pinned' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Full-text match on title and body, best matches first. Every word must match, as a prefix
     * (search-as-you-type). Falls back to a title LIKE when no word is long enough for the FULLTEXT index.
     *
     * @param  Builder<Note>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        // Keep letters, digits and underscores only, so the user can't inject boolean-mode operators.
        $words = preg_split('/\s+/', trim(preg_replace('/[^\p{L}\p{N}_\s]+/u', ' ', $term) ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $words = array_values(array_filter($words, fn (string $w) => mb_strlen($w) >= self::MIN_FULLTEXT_WORD
            && ! in_array(mb_strtolower($w), self::STOPWORDS, true)));

        if ($words === []) {
            $query->whereLike('title', self::containsPattern($term));

            return;
        }

        $against = implode(' ', array_map(fn (string $w) => '+'.$w.'*', $words));
        $query->whereFullText(['title', 'body'], $against, ['mode' => 'boolean'])
            ->orderByRaw('MATCH (title, body) AGAINST (? IN BOOLEAN MODE) DESC', [$against]);
    }

    /** A LIKE pattern matching the term anywhere, with LIKE wildcards in the term escaped. */
    public static function containsPattern(string $term): string
    {
        return '%'.addcslashes(trim($term), '%_\\').'%';
    }
}
