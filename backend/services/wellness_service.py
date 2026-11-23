from models.mood import MoodType
from models.wellness import WellnessActivity

MOOD_SUGGESTIONS: dict[MoodType, str] = {
    "Happy": "Savor this bright moment! Maybe jot down one thing that went well today or share a kind check-in with your companion.",
    "Calm": "Enjoy this steady breathing room. A short gratitude note or gentle study session could pair nicely with your calm energy.",
    "Okay": "Steady, neutral days are completely valid. Try a 3-minute stretch or sip some water before your next task.",
    "Stressed": "Your nervous system is carrying a lot right now. Consider 4 rounds of Box Breathing or stepping away from your screen for 5 minutes.",
    "Sad": "Be extra gentle with yourself today. Maybe wrap up in something cozy, listen to soothing music, or chat with MindMate or a trusted friend.",
    "Overwhelmed": "Let's shrink the day down to just the next tiny step. Pause for a 5-4-3-2-1 grounding breath and pick just one small thing — or rest first.",
}

MOOD_SCORES: dict[MoodType, int] = {
    "Happy": 5,
    "Calm": 4,
    "Okay": 3,
    "Stressed": 2,
    "Sad": 2,
    "Overwhelmed": 1,
}

WELLNESS_ACTIVITIES: list[WellnessActivity] = [
    WellnessActivity(
        id="box-breathing",
        title="4-4-4-4 Box Breathing",
        category="breathing",
        category_label="Guided Breathing",
        duration_minutes=3,
        description="A calm, rhythmic breathing pattern used by students to settle pre-exam nerves and racing thoughts.",
        gentle_benefit="Slows heart rate and signals safety to your nervous system.",
        steps=[
            "Sit comfortably and soften your shoulders away from your ears.",
            "Inhale gently through your nose for 4 seconds.",
            "Hold your breath softly for 4 seconds.",
            "Exhale slowly through your mouth for 4 seconds.",
            "Rest empty for 4 seconds, then repeat for 4–6 calm cycles.",
        ],
        pet_reward_xp=25,
        pet_reward_text="+25 XP & Cozy Calm for your companion",
    ),
    WellnessActivity(
        id="478-breathing",
        title="4-7-8 Evening Reset Breath",
        category="breathing",
        category_label="Guided Breathing",
        duration_minutes=3,
        description="Extended exhale breathing ideal for late-night study tension or winding down before sleep.",
        gentle_benefit="Encourages deeper relaxation and eases restlessness.",
        steps=[
            "Rest the tip of your tongue gently behind your top front teeth.",
            "Breathe in quietly through your nose for 4 seconds.",
            "Hold comfortably for 7 seconds without straining.",
            "Exhale softly with a gentle whoosh for 8 seconds.",
            "Repeat 4 cycles at a pace that feels comfortable for you.",
        ],
        pet_reward_xp=25,
        pet_reward_text="+25 XP & Restful Calm for your companion",
    ),
    WellnessActivity(
        id="grounding-54321",
        title="5-4-3-2-1 Sensory Grounding",
        category="mindfulness",
        category_label="Short Mindfulness",
        duration_minutes=4,
        description="A gentle mindfulness anchor that brings you back to the present room when thoughts spiral.",
        gentle_benefit="Pulls attention out of worry loops into the immediate moment.",
        steps=[
            "Notice 5 things you can softly see around your study space.",
            "Notice 4 things you can physically feel (chair, sweater, feet on floor).",
            "Listen for 3 quiet sounds nearby or in the distance.",
            "Notice 2 gentle scents around you (or think of two favorite scents).",
            "Name 1 kind thing you can offer yourself in the next hour.",
        ],
        pet_reward_xp=25,
        pet_reward_text="+25 XP & Grounded Calm for your companion",
    ),
    WellnessActivity(
        id="study-break-reset",
        title="Cozy Study-Break & Hydration Reset",
        category="study_break",
        category_label="Study-Break Reminder",
        duration_minutes=5,
        description="Step away from lecture slides for 5 intentional minutes to rest your eyes and hydrate.",
        gentle_benefit="Prevents mental fatigue and keeps learning sustainable.",
        steps=[
            "Look at something 20 feet away (a window or far wall) for 20 seconds.",
            "Stand up slowly and roll your ankles and wrists.",
            "Drink a full glass of water or make warm tea.",
            "Remind yourself: resting is part of learning, not falling behind.",
        ],
        pet_reward_xp=20,
        pet_reward_text="+15 Energy & +20 XP for your companion",
    ),
    WellnessActivity(
        id="gratitude-spark",
        title="Three Tiny Gratitudes",
        category="gratitude",
        category_label="Gratitude Journaling",
        duration_minutes=4,
        description="Notice three small, ordinary comforts from today — even a warm drink, a sunny window, or finishing one paragraph.",
        gentle_benefit="Gently widens perspective during heavy academic weeks.",
        steps=[
            "Think of one small physical comfort you enjoyed today.",
            "Think of one person, pet, or moment that felt reassuring.",
            "Think of one tiny effort you made that you can quietly appreciate.",
        ],
        prompt_question="What are 1–3 small things you feel gently grateful for today?",
        pet_reward_xp=20,
        pet_reward_text="+12 Happiness & +20 XP for your companion",
    ),
    WellnessActivity(
        id="daily-reflection",
        title="Gentle End-of-Day Reflection",
        category="reflection",
        category_label="Daily Reflection",
        duration_minutes=5,
        description="Close the mental tabs from your day with kindness — no perfectionism allowed.",
        gentle_benefit="Helps separate your self-worth from today's to-do list.",
        steps=[
            "Acknowledge what felt challenging today without judging yourself.",
            "Name one boundary or rest moment you deserve tonight.",
            "Write a short encouraging note to tomorrow's version of you.",
        ],
        prompt_question="What can you gently set down for tonight, and what went okay today?",
        pet_reward_xp=20,
        pet_reward_text="+10 Affection & +20 XP for your companion",
    ),
    WellnessActivity(
        id="desk-stretch",
        title="Neck, Shoulder & Wrist Unwind",
        category="stretching",
        category_label="Simple Stretching",
        duration_minutes=4,
        description="Four gentle desk stretches tailored for students spending hours typing or reading notes.",
        gentle_benefit="Releases trapped shoulder tension and restores physical ease.",
        steps=[
            "Drop your shoulders and tilt your right ear toward your right shoulder for 20 seconds; switch sides.",
            "Interlace your fingers, reach gently overhead, and take two deep breaths.",
            "Stretch one palm forward and lightly pull fingers back for 15 seconds per wrist.",
            "Sit tall and twist gently right, then left, looking over each shoulder.",
        ],
        pet_reward_xp=20,
        pet_reward_text="+15 Energy & +20 XP for your companion",
    ),
    WellnessActivity(
        id="cozy-pomodoro",
        title="25-Minute Cozy Focus Session",
        category="focus_timer",
        category_label="Focus & Relaxation Timer",
        duration_minutes=25,
        description="A calm single-task focus block with your companion keeping quiet study company beside you.",
        gentle_benefit="Reduces overwhelm by choosing just one manageable block.",
        steps=[
            "Pick one gentle, specific task (e.g., review 5 flashcards or outline 1 section).",
            "Silence non-urgent notifications and start the cozy timer.",
            "When the chime sounds, pause and celebrate showing up — no matter how much got done.",
        ],
        pet_reward_xp=30,
        pet_reward_text="+30 XP & Happy Cheer from your companion",
    ),
    WellnessActivity(
        id="calm-unwind-timer",
        title="10-Minute Quiet Relaxation Timer",
        category="focus_timer",
        category_label="Focus & Relaxation Timer",
        duration_minutes=10,
        description="Ten guilt-free minutes of screen-free quiet rest, gentle music, or daydreaming.",
        gentle_benefit="Lets your brain consolidate memories and recharge naturally.",
        steps=[
            "Set your phone face-down and lean back comfortably.",
            "Let your eyes rest softly or watch the timer glow calmly.",
            "Allow yourself ten minutes with zero productivity goals.",
        ],
        pet_reward_xp=20,
        pet_reward_text="+15 Energy & +20 XP for your companion",
    ),
]


def get_activity_by_id(activity_id: str) -> WellnessActivity | None:
    for item in WELLNESS_ACTIVITIES:
        if item.id == activity_id:
            return item
    return None

