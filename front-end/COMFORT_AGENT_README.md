# 🎯 Comfort Agent - Loved Ones Feature

## Overview
The Comfort Agent provides emotional support to dementia patients by connecting them with memories of their loved ones through photos, audio messages, and call suggestions.

## Database Schema

### Tables Created
1. **loved_ones** - Information about family/friends
   - id, patient_id, name, relationship, phone_number, profile_picture_path

2. **loved_one_photos** - Multiple photos per person with descriptions
   - id, loved_one_id, photo_path, description, created_at

3. **loved_one_audio** - Audio messages from loved ones
   - id, loved_one_id, audio_path, description, duration, created_at

4. **comfort_interactions** - Logs all comfort agent interactions
   - id, patient_id, loved_one_id, interaction_type, details, created_at

## Features

### 1. Photo Viewing
- Shows photos of loved ones with contextual descriptions
- Example: "Sarah at your 75th birthday party"
- Automatically selects relevant photos based on conversation

### 2. Audio Messages
- Plays audio recordings from family members
- Examples: "Goodnight message from Sarah", "Birthday wishes from Michael"
- Supports various audio formats (MP3, WAV, etc.)

### 3. Call Suggestions
- Suggests calling specific people when patient feels lonely
- Provides phone numbers and relationship context
- Tracks when suggestions are made

### 4. Relationship Explanations
- Helps confused patients remember who people are
- Uses warm, simple language
- Combines with photos for better recognition

## Routing Logic

The supervisor routes to comfort agent when:
- Patient mentions a family member's name ("Where is Sarah?")
- Patient expresses loneliness or sadness ("I miss my family")
- Patient asks about relationships ("Who is this person?")
- Patient wants to see photos or hear voices

## Sample Data

The database is seeded with:
- **Sarah Thompson** (daughter) - Doctor, frequent visitor
- **Michael Thompson** (son) - Lives nearby with family
- **Emma Johnson** (granddaughter) - Piano player, brings joy

Each person has:
- Profile picture
- 1-2 memorable photos with descriptions
- 1 audio message

## Media Organization

```
public/
├── photos/
│   └── loved-ones/
│       ├── sarah-profile.jpg
│       ├── sarah-1.jpg
│       ├── michael-profile.jpg
│       └── emma-profile.jpg
└── audio/
    └── loved-ones/
        ├── sarah-goodnight.mp3
        ├── michael-birthday.mp3
        └── emma-song.mp3
```

## Adding New Loved Ones

To add a new loved one:

1. Insert into `loved_ones` table:
```sql
INSERT INTO loved_ones (patient_id, name, relationship, phone_number, profile_picture_path)
VALUES (1, 'John Doe', 'friend', '+1-555-0126', '/photos/loved-ones/john-profile.jpg');
```

2. Add photos:
```sql
INSERT INTO loved_one_photos (loved_one_id, photo_path, description)
VALUES (4, '/photos/loved-ones/john-1.jpg', 'John at the golf club');
```

3. Add audio (optional):
```sql
INSERT INTO loved_one_audio (loved_one_id, audio_path, description, duration)
VALUES (4, '/audio/loved-ones/john-hello.mp3', 'John saying hello', 20);
```

## API Response Format

When comfort agent is triggered, it returns:

```typescript
{
  ...state,
  comfortData: {
    message: "Warm, reassuring message",
    lovedOne: {
      name: "Sarah Thompson",
      relationship: "daughter",
      phoneNumber: "+1-555-0123",
      profilePicture: "/photos/loved-ones/sarah-profile.jpg"
    },
    photos: [
      { path: "/photos/loved-ones/sarah-1.jpg", description: "At your birthday" }
    ],
    audio: {
      path: "/audio/loved-ones/sarah-goodnight.mp3",
      description: "Sarah saying goodnight",
      duration: 15
    },
    callSuggestion: {
      name: "Sarah Thompson",
      relationship: "daughter",
      phoneNumber: "+1-555-0123"
    }
  }
}
```

## Frontend Integration

The frontend should display:
- Comfort message prominently
- Photos in a gallery or slideshow
- Audio player for messages
- "Call" button with loved one's details
- Profile picture of the loved one being discussed

## Testing

Test inputs:
- "I miss Sarah" → Should show Sarah's photos and suggest calling
- "Who is that?" (when looking at photo) → Should explain relationship
- "I feel lonely" → Should show family photos and offer comfort
- "Play a message" → Should play audio from most mentioned loved one

## Future Enhancements

- Video messages support
- Voice recognition to identify loved ones in photos
- Scheduled reminders to call specific people
- Integration with calendar for birthdays/anniversaries
- Machine learning to predict which loved one to suggest
