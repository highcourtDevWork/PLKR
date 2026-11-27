<?php

namespace App\Enums;

/** Who wrote a piece of content. AI-written content is tracked so it can be reviewed and filtered. */
enum ContentSource: string
{
    case Manual = 'manual';
    case Ai = 'ai';
}
