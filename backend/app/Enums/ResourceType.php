<?php

namespace App\Enums;

enum ResourceType: string
{
    case Link = 'link';
    case Article = 'article';
    case Video = 'video';
    case Book = 'book';
    case Course = 'course';
    case Doc = 'doc';
}
