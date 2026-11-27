<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/** Notes are private: another user's note is reported as missing (404). */
class NotePolicy
{
    public function view(User $user, Note $note): Response
    {
        return $note->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    public function update(User $user, Note $note): Response
    {
        return $this->view($user, $note);
    }

    public function delete(User $user, Note $note): Response
    {
        return $this->view($user, $note);
    }
}
