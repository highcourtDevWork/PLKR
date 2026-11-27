<?php

namespace App\Enums;

enum NoteKind: string
{
    case General = 'general';
    case Explanation = 'explanation';
    case Example = 'example';
    case Snippet = 'snippet';
    case Mistake = 'mistake';
    case Feynman = 'feynman';
    case Summary = 'summary';
}
