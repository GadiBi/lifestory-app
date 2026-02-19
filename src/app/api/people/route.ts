import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Relationship patterns to detect in text
const relationshipPatterns: [RegExp, string][] = [
  [/\b(mom|mother|mama|ima)\b/i, 'Mother'],
  [/\b(dad|father|papa|abba|aba)\b/i, 'Father'],
  [/\b(grandma|grandmother|savta|nana|granny)\b/i, 'Grandmother'],
  [/\b(grandpa|grandfather|saba|grandad)\b/i, 'Grandfather'],
  [/\b(brother)\b/i, 'Brother'],
  [/\b(sister)\b/i, 'Sister'],
  [/\b(wife)\b/i, 'Wife'],
  [/\b(husband)\b/i, 'Husband'],
  [/\b(son)\b/i, 'Son'],
  [/\b(daughter)\b/i, 'Daughter'],
  [/\b(uncle)\b/i, 'Uncle'],
  [/\b(aunt|auntie)\b/i, 'Aunt'],
  [/\b(cousin)\b/i, 'Cousin'],
  [/\b(friend|best friend)\b/i, 'Friend'],
  [/\b(teacher|professor|mentor)\b/i, 'Teacher/Mentor'],
  [/\b(boss|manager|colleague|coworker)\b/i, 'Colleague'],
  [/\b(neighbor|neighbour)\b/i, 'Neighbor'],
];

// Common words to exclude from proper noun detection — be very aggressive to avoid false positives
const excludeWords = new Set([
  // Pronouns & articles
  'The', 'And', 'But', 'For', 'Not', 'You', 'She', 'His', 'Her', 'Was', 'Are',
  'They', 'This', 'That', 'Would', 'Could', 'Should', 'Have', 'Been', 'When',
  'What', 'How', 'Who', 'Why', 'Where', 'Yes', 'Yeah', 'Well', 'Also', 'Then',
  'There', 'Here', 'Just', 'Like', 'Very', 'Really', 'Actually', 'About',
  'After', 'Before', 'During', 'Because', 'Since', 'Until', 'While', 'Some',
  'Many', 'Much', 'Most', 'Other', 'Each', 'Every', 'Both', 'Few', 'More',
  'Into', 'Over', 'Such', 'Still', 'Back', 'Even', 'Made', 'Never', 'Always',
  'Sometimes', 'Often', 'Once', 'Twice', 'Today', 'Yesterday', 'Tomorrow',
  // Days & months
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  // Family/relationship words (already detected by patterns)
  'Mom', 'Dad', 'Mother', 'Father', 'Brother', 'Sister', 'Grandma', 'Grandpa',
  'Wife', 'Husband', 'Son', 'Daughter', 'Uncle', 'Aunt', 'Cousin', 'Family',
  'Friend', 'Teacher', 'Mentor', 'Boss', 'Neighbor', 'Colleague',
  // Common nouns that start sentences
  'People', 'Chat', 'Story', 'Life', 'Time', 'Years', 'Place', 'Home', 'School',
  'Work', 'World', 'Children', 'Things', 'Something', 'Everything', 'Nothing',
  'Everyone', 'Someone', 'Anyone', 'Nobody', 'Memories', 'Memory', 'Moment',
  'Moments', 'Part', 'Way', 'Day', 'Days', 'Night', 'Nights', 'Morning',
  'Year', 'Month', 'Week', 'First', 'Last', 'Next', 'New', 'Old', 'Good',
  'Best', 'Great', 'Little', 'Big', 'Long', 'Small', 'Young', 'Early',
  // App/UI words
  'Continue', 'Start', 'Begin', 'Share', 'Upload', 'Download', 'Save',
  'Edit', 'Delete', 'Add', 'Open', 'Close', 'Send', 'Write', 'Read',
  // Common verbs/words at start of sentences
  'Think', 'Know', 'Remember', 'Told', 'Said', 'Asked', 'Went', 'Came',
  'Took', 'Gave', 'Left', 'Right', 'Found', 'Lost', 'Felt', 'Loved',
  'Wanted', 'Needed', 'Started', 'Moved', 'Lived', 'Worked', 'Played',
  'Called', 'Named', 'Born', 'Grew', 'Became', 'Died', 'Married',
  // Places & directions
  'North', 'South', 'East', 'West', 'Street', 'Road', 'City', 'Town',
  'Country', 'State', 'Israel', 'America', 'Europe', 'House', 'Building',
  // Other common capitalized words
  'God', 'Lord', 'Army', 'War', 'Peace', 'King', 'Queen', 'Church',
  'Temple', 'High', 'Middle', 'College', 'University', 'Hospital',
  'Summer', 'Winter', 'Spring', 'Fall', 'Autumn', 'Christmas', 'Easter',
  'Passover', 'Thank', 'Sorry', 'Please', 'Hello', 'Welcome',
  // Life periods & timeline terms
  'Childhood', 'Teenage', 'Adulthood', 'Youth', 'Retirement', 'Period',
  'Timeline', 'Milestone', 'Achievement', 'Challenge', 'Career', 'Education',
  'Relationship', 'Travel', 'Health', 'Birthday', 'Anniversary', 'Graduation',
  'Wedding', 'Funeral', 'Holiday', 'Vacation', 'Trip', 'Journey', 'Adventure',
  // Common place names
  'Jerusalem', 'Aviv', 'Haifa', 'York', 'London', 'Paris', 'Berlin',
  'Moscow', 'Tokyo', 'Beijing', 'Sydney', 'Toronto', 'Chicago', 'Miami',
  'Angeles', 'Francisco', 'Diego', 'Vegas', 'Hollywood', 'Brooklyn',
  'Manhattan', 'Queens', 'Bronx', 'Boston', 'Washington', 'Philadelphia',
  // Abstract concepts
  'Love', 'Hope', 'Faith', 'Joy', 'Fear', 'Anger', 'Grief', 'Pride',
  'Happiness', 'Sadness', 'Freedom', 'Success', 'Failure', 'Strength',
  'Courage', 'Wisdom', 'Truth', 'Beauty', 'Justice', 'Mercy',
  // AI/app terms
  'Bestie', 'Chat', 'Interview', 'Extract', 'Event', 'Events',
]);

// Only accept a proper noun as a person name if it appears near a person-context word
const personContextPatterns = [
  /\b(named|called|met|knew|married|loved|friend|with|and)\s+[A-Z]/i,
  /\b[A-Z][a-z]+\s+(said|told|asked|came|went|was|is|had|loved|married)/i,
  /\bmy\s+(friend|brother|sister|mother|father|uncle|aunt|cousin|neighbor)\s+[A-Z]/i,
];

interface PersonInfo {
  name: string;
  relationship: string;
  mentions: { type: 'event' | 'conversation'; id: string; title: string }[];
}

// POST /api/people - Manually add a person
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, relationship } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        relationship: relationship || 'Person',
      },
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    console.error('People POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/people - Extract people from user's conversations and life events
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [events, interviews, manualPeople] = await Promise.all([
      prisma.lifeEvent.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, description: true },
      }),
      prisma.interview.findMany({
        where: { userId: session.user.id },
        select: { id: true, conversationLog: true, currentPeriod: true, updatedAt: true },
      }),
      prisma.person.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const peopleMap = new Map<string, PersonInfo>();

    function addPerson(name: string, relationship: string, mention: PersonInfo['mentions'][0]) {
      const key = name.toLowerCase();
      if (peopleMap.has(key)) {
        const person = peopleMap.get(key)!;
        // Don't duplicate mentions
        if (!person.mentions.some(m => m.id === mention.id && m.type === mention.type)) {
          person.mentions.push(mention);
        }
      } else {
        peopleMap.set(key, { name, relationship, mentions: [mention] });
      }
    }

    // Track how many times each proper noun appears across all texts
    const nounFrequency = new Map<string, number>();

    function countNoun(noun: string) {
      const key = noun.toLowerCase();
      nounFrequency.set(key, (nounFrequency.get(key) || 0) + 1);
    }

    function isLikelyPersonName(noun: string, surroundingText: string): boolean {
      if (excludeWords.has(noun)) return false;
      // Must be 3+ chars
      if (noun.length < 3) return false;
      // Check if it appears near person-context words
      for (const pattern of personContextPatterns) {
        if (pattern.test(surroundingText)) {
          // Check if this noun is part of the match
          if (surroundingText.includes(noun)) return true;
        }
      }
      // Accept if mentioned 3+ times (likely a real name)
      const freq = nounFrequency.get(noun.toLowerCase()) || 0;
      if (freq >= 3) return true;
      return false;
    }

    // First pass: count all proper noun frequencies
    const allTexts: string[] = [];
    for (const event of events) {
      const text = `${event.title} ${event.description}`;
      allTexts.push(text);
      const nouns = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
      for (const noun of nouns) countNoun(noun);
    }
    for (const interview of interviews) {
      try {
        const messages = JSON.parse(interview.conversationLog || '[]') as { role: string; content: string }[];
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const fullText = userMessages.join(' ');
        allTexts.push(fullText);
        const nouns = fullText.match(/\b[A-Z][a-z]{2,}\b/g) || [];
        for (const noun of nouns) countNoun(noun);
      } catch {
        // skip
      }
    }

    // Scan life events
    for (const event of events) {
      const text = `${event.title} ${event.description}`;

      // Check relationship patterns
      for (const [pattern, rel] of relationshipPatterns) {
        if (pattern.test(text)) {
          addPerson(rel, rel, { type: 'event', id: event.id, title: event.title });
        }
      }

      // Extract proper nouns — only if they look like real person names
      const properNouns = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
      for (const noun of properNouns) {
        if (isLikelyPersonName(noun, text)) {
          addPerson(noun, 'Person', { type: 'event', id: event.id, title: event.title });
        }
      }
    }

    // Scan conversations
    for (const interview of interviews) {
      try {
        const messages = JSON.parse(interview.conversationLog || '[]') as { role: string; content: string }[];
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const fullText = userMessages.join(' ');
        const convTitle = interview.currentPeriod || `Conversation`;

        // Check relationship patterns
        for (const [pattern, rel] of relationshipPatterns) {
          if (pattern.test(fullText)) {
            addPerson(rel, rel, { type: 'conversation', id: interview.id, title: convTitle });
          }
        }

        // Extract proper nouns — only if they look like real person names
        const properNouns = fullText.match(/\b[A-Z][a-z]{2,}\b/g) || [];
        for (const noun of properNouns) {
          if (isLikelyPersonName(noun, fullText)) {
            addPerson(noun, 'Person', { type: 'conversation', id: interview.id, title: convTitle });
          }
        }
      } catch {
        // Skip unparseable conversations
      }
    }

    // Merge in manually added people
    for (const mp of manualPeople) {
      const key = mp.name.toLowerCase();
      if (peopleMap.has(key)) {
        const existing = peopleMap.get(key)!;
        // Upgrade relationship if manual one is more specific
        if (existing.relationship === 'Person' && mp.relationship !== 'Person') {
          existing.relationship = mp.relationship;
        }
      } else {
        peopleMap.set(key, { name: mp.name, relationship: mp.relationship, mentions: [] });
      }
    }

    // Convert to array and sort by mention count
    const people = Array.from(peopleMap.values())
      .sort((a, b) => b.mentions.length - a.mentions.length);

    return NextResponse.json({ people });
  } catch (error) {
    console.error('People extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract people' }, { status: 500 });
  }
}
