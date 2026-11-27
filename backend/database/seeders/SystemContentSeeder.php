<?php

namespace Database\Seeders;

use App\Enums\Level;
use App\Models\LearningPath;
use App\Models\Module;
use App\Models\Topic;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Built-in, read-only learning content (user_id = null). Safe to run repeatedly: existing paths are skipped.
 */
class SystemContentSeeder extends Seeder
{
    /**
     * Path title => [level, description, modules: [title => topics]], where a topic is a title
     * or [title => [subtopic titles]].
     *
     * @var array<string, array{level: Level, description: string, modules: array<string, list<string|array<string, list<string>>>>}>
     */
    private const PATHS = [
        'Laravel Fundamentals' => [
            'level' => Level::Beginner,
            'description' => 'The core of Laravel: request lifecycle, routing, Eloquent and testing.',
            'modules' => [
                'Getting started' => [
                    'Request lifecycle',
                    ['Service container' => ['Binding', 'Resolving and auto-wiring']],
                    'Service providers',
                    'Configuration and environment',
                ],
                'Routing and HTTP' => [
                    'Routing',
                    'Middleware',
                    'Controllers',
                    'Form Request validation',
                    'API resources',
                ],
                'Eloquent ORM' => [
                    'Models and conventions',
                    ['Relationships' => ['One-to-many', 'Many-to-many', 'Eager loading and N+1']],
                    'Query scopes',
                    'Migrations and indexes',
                ],
                'Testing' => [
                    'Feature tests',
                    'Model factories',
                    'Fakes: queue, mail and HTTP',
                ],
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::PATHS as $title => $definition) {
            if (LearningPath::whereNull('user_id')->where('title', $title)->exists()) {
                continue;
            }

            DB::transaction(fn () => $this->createPath($title, $definition));
        }
    }

    /**
     * @param  array{level: Level, description: string, modules: array<string, list<string|array<string, list<string>>>>}  $definition
     */
    private function createPath(string $title, array $definition): void
    {
        $path = new LearningPath([
            'title' => $title,
            'description' => $definition['description'],
            'level' => $definition['level'],
            'position' => 0,
        ]);
        $path->user_id = null;
        $path->save();

        $modulePosition = 0;
        foreach ($definition['modules'] as $moduleTitle => $topics) {
            $module = $path->modules()->create(['title' => $moduleTitle, 'position' => $modulePosition++]);

            $topicPosition = 0;
            foreach ($topics as $topic) {
                if (is_string($topic)) {
                    $this->createTopic($module, $topic, $definition['level'], $topicPosition++);

                    continue;
                }

                foreach ($topic as $parentTitle => $subtopics) {
                    $parent = $this->createTopic($module, $parentTitle, $definition['level'], $topicPosition++);
                    foreach ($subtopics as $subPosition => $subtopic) {
                        $this->createTopic($module, $subtopic, $definition['level'], $subPosition, $parent->id);
                    }
                }
            }
        }
    }

    private function createTopic(Module $module, string $title, Level $level, int $position, ?int $parentId = null): Topic
    {
        $topic = new Topic(['title' => $title, 'level' => $level, 'position' => $position]);
        $topic->module_id = $module->id;
        $topic->parent_id = $parentId;
        $topic->save();

        return $topic;
    }
}
