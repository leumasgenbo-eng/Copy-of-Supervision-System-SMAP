

import { Department, GradeRange, CoreGradingScale, IndicatorScale, StudentData, Module } from './types';

export const DAYCARE_REMARKS = [
    "Completed Successfully",
    "Partially Completed",
    "Not Completed",
    "Learners Participated Actively",
    "Learners Needed Support",
    "Activity Was Too Challenging",
    "Activity Was Too Easy",
    "Repeat Next Week",
    "Extend Activity",
    "Use Additional Resources",
    "Learners Enjoyed Activity",
    "Behavioural Challenges Noticed",
    "Good Progress Shown",
    "Work Sent Home"
];

// Detailed Groups for Indicators (Assessment - Populated from user request)
export const DAYCARE_ACTIVITY_GROUPS = [
    {
        group: "ENJOY RUNNING AND CLIMBING (Physical/outdoor movement)",
        activities: [
            "Playing with equipment", "Physical development", "Outdoor play / exploration", 
            "Games", "Exploration", "Pushing & pulling", "Rolling", "Running & climbing"
        ]
    },
    {
        group: "INDICATE TOILET NEEDS (Direct or related hygiene skills)",
        activities: ["Washing hands", "Wiping practices", "Indicate Toilet Needs"]
    },
    {
        group: "PERFORM SELF-HELP ACTIVITIES",
        activities: [
            "Shoe polishing", "Dressing skills", "Dressing", "Bagging", "Washing hands", 
            "Folding", "Sorting", "Pairing", "Setting table", "Dusting", "Arranging chairs", 
            "Arranging logo", "Grooming", "Napping time", "Practice good eating habits", 
            "Snack break – eating habits & table manners"
        ]
    },
    {
        group: "ENJOY PLAYING WITH OTHER CHILDREN (Social play)",
        activities: [
            "Games", "Play", "Exploration", "Role play", "Playing with toys", "Waiting to go home"
        ]
    },
    {
        group: "WILLINGLY SHARES FOOD / PLAY WITH OTHERS",
        activities: ["Sharing", "Snack break – eating habits", "Table manners"]
    },
    {
        group: "INTEREST IN DANCE, DRAMA, SOCIAL AND CULTURAL ACTIVITIES",
        activities: [
            "Dancing", "Action songs", "Story time / picture story", "Class worship routine", 
            "Music", "Rhymes & songs", "Outdoor poem / rhyme / recitation", "Social conversation activities"
        ]
    },
    {
        group: "LOOKS HAPPY AND CHEERFUL DURING PLAY AND OTHER ACTIVITIES",
        activities: [
            "Morning routines", "Conversation", "Class rules", "Picture matching", "Naming objects", 
            "Identification of objects", "Playing with toys", "Games & exploration", "Waving"
        ]
    },
    {
        group: "IDENTIFY FAMILIAR NATURE SOUNDS",
        activities: ["Sounds of animals", "Nature-related sound activities"]
    },
    {
        group: "IDENTIFY MECHANICAL SOUNDS",
        activities: ["Mechanical sound identification"]
    },
    {
        group: "INTEREST IN PAINTING, MOULDING, ART AND CREATIVE WORK",
        activities: [
            "Painting", "Scribbling", "Colouring", "Drawing", "Moulding", "Modelling", 
            "Weaving", "Construction", "Pattern maps", "Repeating of patterns", "Puzzles", 
            "Threading", "Picture description", "Picture reading"
        ]
    },
    {
        group: "SAY AND ACT SIMPLE NURSERY RHYMES",
        activities: [
            "Rhymes", "Songs", "Recitations", "Action songs", "Jolly phonics drills", "Jolly Phonics", 
            "Outdoor poem / rhyme", "Picture stories used for rhyme/storytelling"
        ]
    },
    {
        group: "LANGUAGE & EARLY LITERACY DEVELOPMENT",
        activities: [
            "Writing letters", "Tracing", "Letters & sounds", "Letters/sounds", "Comprehension-based writing", 
            "Picture reading", "Literacy centres", "Picture story", "Picture matching", 
            "Picture description", "Counting words", "Naming objects", "Story time", 
            "Conversation", "Eye-movement training"
        ]
    },
    {
        group: "COGNITIVE & NUMERACY SKILLS",
        activities: [
            "Counting", "Counting items", "Shapes", "Puzzles", "Sorting", "Pairing", 
            "Pattern maps", "Memory games"
        ]
    },
    {
        group: "PRACTICAL LIFE / MONTESSORI SKILLS",
        activities: [
            "Scooping", "Pouring", "Rolling", "Threading", "Weaving", "Sewing", 
            "Setting table", "Folding", "Dusting", "Arranging chairs", "Arranging logo"
        ]
    },
    {
        group: "KNOWING MY WORLD – SOCIAL & ENVIRONMENTAL AWARENESS",
        activities: [
            "Myself", "Family", "Sitting room", "Kitchen", "Identification of objects", 
            "Sound awareness", "Naming objects"
        ]
    }
];

// Specific Groups for Time Table Generation (Populated from user request)
export const DAYCARE_TIMETABLE_GROUPS = [
    { 
        group: "Language & Literacy", 
        activities: [
            "Rhymes & Songs", "Recitations", "Poems", "Picture Story", "Storytelling & Sharing",
            "Print awareness", "Picture Matching", "Letter Sounds", "Two Letter Sounds",
            "Jolly Phonics Drills", "Writing Letters", "Action Songs", "Picture Reading",
            "Comprehension Activities", "Naming Objects", "Memory Games", "Tracing Letters", 
            "Reading Readiness Activities"
        ]
    },
    { 
        group: "Numeracy", 
        activities: [
            "Counting Items", "Number Identification", "Pattern Mapping", "Sorting & Grouping",
            "Throwing & Catching (numeracy game)", "Puzzles", "Tracing Numerals", 
            "Shapes Identification", "Left-to-Right Eye Movement Training", "Counting Words", 
            "Repeating Patterns"
        ]
    },
    { 
        group: "Our World Our People (OWOP)", 
        activities: [
            "Myself & My Family", "Kitchen / Home Objects", "Community Helpers", "Parts of the Body",
            "Sound of Domestic Animals", "Hygiene Practices", "Washing Hands", "Good Eating Habits",
            "Table Manners", "Classroom Rules", "Identifying Familiar Objects", "Environmental Exploration",
            "Waiting to go home routines"
        ]
    },
    { 
        group: "Creative / Practical Activity", 
        activities: [
            "Painting", "Colouring", "Scribbling", "Construction", "Moulding", "Modelling",
            "Threading", "Weaving", "Drawing", "Craft Work", "Tearing Games", "Role Play",
            "Playing With Toys", "Musical Games", "Dancing to Music", "Art & Craft Posters"
        ]
    },
    {
        group: "Practical Life Skills",
        activities: [
            "Shoe Polishing", "Dressing Skills", "Push & Pull Activities", "Wiping Practices",
            "Scooping", "Rolling", "Folding", "Sorting", "Pairing", "Setting Table",
            "Dusting Chairs & Tables", "Arranging Chairs", "Arranging Learning Materials",
            "Fetching Water", "Bagging"
        ]
    },
    {
        group: "Physical Development",
        activities: [
            "Outdoor Poem / Rhyme", "Physical Education", "Throwing & Catching",
            "Jumping Games", "Climbing", "Gross Motor Play", "Play Equipment Time"
        ]
    }
];

export const DAYCARE_INDICATORS = DAYCARE_ACTIVITY_GROUPS.flatMap(group => group.activities);

export const SCHOOL_VENUES = [
  "Classroom", "Playground", "Sensory Room", "Nap Room", "Canteen / Dining Hall",
  "Assembly Hall", "School Garden", "Library / Reading Corner", "Music Room",
  "Computer Lab", "Sick Bay", "Main Field", "Sand Pit", "Water Play Area"
];

// Updated Daycare Period Config
export const DAYCARE_PERIOD_CONFIG = [
    { id: "L0", label: "Arrival & Settling", defaultTime: "07:30 - 08:00", type: "Routine" },
    { id: "L1", label: "Circle Time", defaultTime: "08:30 - 09:25", type: "Lesson" },
    { id: "L2", label: "Group Activity 1", defaultTime: "09:25 - 10:20", type: "Lesson" },
    { id: "B1", label: "Snack Break", defaultTime: "10:20 - 10:35", type: "Break" },
    { id: "L3", label: "Group Activity 2", defaultTime: "10:35 - 11:30", type: "Lesson" },
    { id: "L4", label: "Phonics Time", defaultTime: "11:30 - 12:25", type: "Lesson" },
    { id: "B2", label: "Lunch Break", defaultTime: "12:25 - 13:10", type: "Break" },
    { id: "L5", label: "Learning Centre", defaultTime: "13:10 - 13:55", type: "Lesson" },
    { id: "L6", label: "Story Time", defaultTime: "13:55 - 14:50", type: "Lesson" },
    { id: "L7", label: "Closing", defaultTime: "14:50 - 15:30", type: "Routine" }
];

export const DAYCARE_PERIODS = DAYCARE_PERIOD_CONFIG.map(p => p.id);

// --- ACADEMIC CALENDAR LISTS ---
export const CALENDAR_LISTS = {
    periods: [
        "Reopening Week", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", 
        "Week 6", "Week 7", "Week 8 – Mid-Term", "Week 9", "Week 10", 
        "Week 11", "Week 12", "Week 13 – Revision Week", 
        "Week 14 – Examination Week", "Week 15 – Vacation / Graduation", "Week 16"
    ],
    activities: [
        "Reopening / Cleaning / Orientation", "Staff Meeting", "Preparation of SOL/SOW", 
        "Submission of SOL/SOW", "PLC: Stages of Learner Development", 
        "PLC: Test Item Preparation", "PLC: Qualities of Good and Effective Teacher", 
        "PLC: Handling Learning Disabilities", "PLC: Peer Tutoring / Teaching Practice", 
        "PLC: Techniques of Teaching I", "PLC: Techniques of Teaching II", 
        "PLC: Teaching Methods I", "PLC: Teaching Methods II", "PLC: Reflection", 
        "Inspection of Registers", "Inspection of SBA/Registers", 
        "Teaching / Normal Classes", "Health Talk", "Talk Session", 
        "Peer Pressure Education", "Homework Management Skills", "INSET", 
        "Revision Week", "Examination Week", "Vacation / Graduation", 
        "Mid-Term Examination", "Field Trip / Excursion / Hiking", 
        "Civic Education", "Leadership & Prefectship Training", 
        "Magazine / Journal Writing"
    ],
    assessments: [
        "No Assessment This Week", "C.A.T 1,4,7", "C.A.T 2,5,8", "C.A.T 3,6,9",
        "Mock 1", "Mock 2", "Mock 3", "Mock 4", "Mock 5", "Mock 6", "Mock 7", "Mock 8"
    ],
    leadTeam: [
        "Sir Michael", "Sir Mishael", "Sir Manasseh", "Sir Miguel", "Sir Frank", 
        "Sir Geoffrey", "Sir Samuel", "Sir Appiah", "Sir Emmanuel", "Madam Abigail", 
        "Madam Priccy", "Madam Ruby", "Madam Juliana", "Madam Theresa", 
        "Madam Priscilla", "Madam Lawrencia", "Madam Cynthia", "Madam Joana", "Madam Julie"
    ],
    extraCurricular: [
        "Pick-And-Act", "Spelling Bee Contest", "Sports & Athletics", "Inter-Class Games", 
        "Inter-Sectional Sports", "Indoor Games", "Outdoor Games", "Talent Exhibition", 
        "Performing Arts Showcase", "Debate Competition", "Model Parliament", 
        "Sanitation Campaign", "Oral Hygiene Demonstrations", "Puzzle Task Activities", 
        "Club Discussions", "Fruit & Colours Day", "Movie Day", "Music & Dance", 
        "Cultural Dance", "Art Competition", "Artefact Design", "Civic Values Demonstration", 
        "Picnic / Excursion / Field Trip", "Our Day Celebration", "Readers Day", 
        "Leadership Activities", "Preschool Demonstrations (Action Words)"
    ]
};

export const JHS_SUBJECT_LIST = [
    "Mathematics", "English Language", "Science", "Social Studies", // Core
    "Computing", "Religious and Moral Education", "Creative Arts and Designing", 
    "Career Technology", "French", "Ghana Language Option (Twi)" // Elective
];

export const BASIC_SUBJECT_LIST = [
    "Mathematics", "English Language", "Science", "History", // Core
    "ICT", "Religious and Moral Education", "Creative Arts and Designing", 
    "Creative Arts", "French", "Ghana Language Option (Twi)" // Elective
];

export const DAYCARE_SUBJECTS = ["Language & Literacy", "Numeracy", "Our World Our People", "Creative Arts"];

// Helper to get subjects based on Department
export const getSubjectsForDepartment = (dept: Department): string[] => {
    if (dept === "Daycare" || dept === "Nursery" || dept === "Kindergarten") return DAYCARE_SUBJECTS;
    if (dept === "Junior High School") return JHS_SUBJECT_LIST;
    if (dept === "Lower Basic School" || dept === "Upper Basic School") return BASIC_SUBJECT_LIST;
    return JHS_SUBJECT_LIST; // Default fallback
};

export const SUBJECT_LIST = JHS_SUBJECT_LIST; 
export const CORE_SUBJECTS = ["Mathematics", "English Language", "Social Studies", "Science", "History", "Integrated Science"];

export const FACILITATORS: Record<string, string> = {};

export const DEFAULT_GRADING_REMARKS: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good', 'C4': 'Credit',
    'C5': 'Credit', 'C6': 'Credit', 'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail'
};

export const RAW_STUDENTS: StudentData[] = [];

export const MODULES: Module[] = [
  "Time Table",
  "Staff Management",
  "Pupil Management",
  "Assessment",
  "Result Entry",
  "Materials & Logistics",
  "Special Event Day",
  "Lesson Plans",
  "Exercise Assessment"
];

// Constants for scales
export const EC_CORE_SCALE_3_POINT: CoreGradingScale = {
    type: '3-point',
    ranges: [
        { min: 80, max: 100, grade: '3', remark: 'Exceeds Expectations', color: 'text-green-600' },
        { min: 50, max: 79, grade: '2', remark: 'Meets Expectations', color: 'text-blue-600' },
        { min: 0, max: 49, grade: '1', remark: 'Below Expectations', color: 'text-red-600' }
    ]
};

export const EC_CORE_SCALE_5_POINT: CoreGradingScale = {
    type: '5-point',
    ranges: [
        { min: 90, max: 100, grade: 'A', remark: 'Excellent', color: 'text-green-700' },
        { min: 75, max: 89, grade: 'B', remark: 'Good', color: 'text-blue-700' },
        { min: 60, max: 74, grade: 'C', remark: 'Satisfactory', color: 'text-yellow-600' },
        { min: 45, max: 59, grade: 'D', remark: 'Needs Improvement', color: 'text-orange-600' },
        { min: 0, max: 44, grade: 'E', remark: 'Unsatisfactory', color: 'text-red-600' }
    ]
};

export const EC_CORE_SCALE_9_POINT: CoreGradingScale = {
    type: '9-point',
    ranges: [
        { min: 80, max: 100, grade: '1', remark: 'Highest', color: 'text-green-800' },
        { min: 75, max: 79, grade: '2', remark: 'Higher', color: 'text-green-600' },
        { min: 70, max: 74, grade: '3', remark: 'High', color: 'text-blue-600' },
        { min: 65, max: 69, grade: '4', remark: 'High Average', color: 'text-blue-500' },
        { min: 60, max: 64, grade: '5', remark: 'Average', color: 'text-yellow-600' },
        { min: 55, max: 59, grade: '6', remark: 'Low Average', color: 'text-yellow-500' },
        { min: 50, max: 54, grade: '7', remark: 'Low', color: 'text-orange-500' },
        { min: 45, max: 49, grade: '8', remark: 'Lower', color: 'text-red-500' },
        { min: 0, max: 44, grade: '9', remark: 'Lowest', color: 'text-red-700' }
    ]
};

export const INDICATOR_SCALE_3_POINT: IndicatorScale = {
    type: '3-point',
    ranges: [
        { min: 2.5, max: 3, grade: '3', remark: 'Consistently', color: 'bg-green-100' },
        { min: 1.5, max: 2.4, grade: '2', remark: 'Sometimes', color: 'bg-yellow-100' },
        { min: 0, max: 1.4, grade: '1', remark: 'Rarely', color: 'bg-red-100' }
    ]
};

export const INDICATOR_SCALE_5_POINT: IndicatorScale = {
    type: '5-point',
    ranges: [
        { min: 4.5, max: 5, grade: '5', remark: 'Always', color: 'bg-green-200' },
        { min: 3.5, max: 4.4, grade: '4', remark: 'Often', color: 'bg-green-100' },
        { min: 2.5, max: 3.4, grade: '3', remark: 'Sometimes', color: 'bg-yellow-100' },
        { min: 1.5, max: 2.4, grade: '2', remark: 'Rarely', color: 'bg-orange-100' },
        { min: 0, max: 1.4, grade: '1', remark: 'Never', color: 'bg-red-100' }
    ]
};

export const DAYCARE_SKILLS = [
  "Physical Development",
  "Music & Movement",
  "Social Skills",
  "Practical Life Skills"
];

export const DEPARTMENT_CLASSES: Record<Department, string[]> = {
    "Daycare": ["Creche", "D1", "D2"],
    "Nursery": ["N1", "N2"],
    "Kindergarten": ["K1", "K2"],
    "Lower Basic School": ["Basic 1", "Basic 2", "Basic 3"],
    "Upper Basic School": ["Basic 4", "Basic 5", "Basic 6"],
    "Junior High School": ["Basic 7", "Basic 8", "Basic 9"]
};

export const ALL_CLASSES_FLAT = Object.values(DEPARTMENT_CLASSES).flat();

export const DAYCARE_ACTIVITIES_LIST = [
    "Arrival & Welcome", "Circle Time", "Group Activity 1 (Indoor)", "Group Activity 1 (Outdoor)",
    "Group Activity 2 (Indoor)", "Group Activity 2 (Outdoor)", "Phonics Time", "Learning Centre",
    "Story Time", "Closing", "Snack Break", "Lunch Break", "Worship", "Physical Education"
];

// Grouped mapping mainly for Time Table usage
export const DAYCARE_DETAILS_GROUPED = {
    "Language & Literacy": DAYCARE_TIMETABLE_GROUPS.find(g => g.group === "Language & Literacy")?.activities || [],
    "Numeracy": DAYCARE_TIMETABLE_GROUPS.find(g => g.group === "Numeracy")?.activities || [],
    "OWOP": DAYCARE_TIMETABLE_GROUPS.find(g => g.group.includes("Our World"))?.activities || [],
    "Creative / Practical": DAYCARE_TIMETABLE_GROUPS.find(g => g.group.includes("Creative"))?.activities || [],
    "Practical Life Skills": DAYCARE_TIMETABLE_GROUPS.find(g => g.group === "Practical Life Skills")?.activities || [],
    "Physical Development": DAYCARE_TIMETABLE_GROUPS.find(g => g.group === "Physical Development")?.activities || []
};

export const DAYCARE_TLMS = [
    "Poster Charts", "Teacher made Poster", "Picture Reading Books", "Drawing Books",
    "Science Book", "Colouring Book", "Creativity Book", "Numeracy/ Mathematics Book",
    "TLRs (Teaching & Learning Resources)", "Audio & Visual Devices", "Jolly Phonics Book",
    "Recorded Music", "Flashcards", "Manipulatives", "Puzzles", "Blocks and Legos",
    "Musical Instruments", "Story Books", "Art Supplies (crayons, paint, brushes)",
    "Writing Tools (pencils, markers)", "Plastic Letters & Numbers", "Outdoor Equipment",
    "Role-play Materials", "Nature Items (leaves, stones, sand)", "Construction Toys"
];

// Alias for backward compatibility if needed, but we now use DAYCARE_TIMETABLE_GROUPS explicitly
export const DAYCARE_ACTIVITY_GROUPS_CONST = DAYCARE_TIMETABLE_GROUPS;

export const CLASS_RULES = ["Punctuality...", "Appearance..."]; 
export const BOOK_LIST_TEMPLATES = { "Daycare": [], "Nursery": [] }; 
export const LESSON_ASSESSMENT_CHECKLIST_B = { "B1": { title: "Objectives", items: [], weight: 10 } }; 
export const LESSON_OBSERVATION_CHECKLIST_C = { "C1": [] };

export const BASIC_VENUES = [
    "B1 A", "B1 B", "B2 A", "B2 B", "B3 A", "B3 B",
    "B4 A", "B4 B", "B5 A", "B5 B", "B6 A", "B6 B",
    "B7 A", "B7 B", "B8 A", "B8 B", "B9 A", "B9 B"
];

export const OBSERVER_ROLES = [
    "Supervisory", "Facilitator", "Facilitator Assistant", "Caregiver", "Guest resource"
];