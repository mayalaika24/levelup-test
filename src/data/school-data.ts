export interface SchoolData {
    name: string;
    nameEn: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    academicYears: {
        id: string;
        year: string;
        isCurrent: boolean;
    }[];
}

export const schoolData: SchoolData = {
    name: "أكاديمية ليفل أب",
    nameEn: "LevelUp Academy",
    logo: "/logo.png",
    address: "السعودية، الرياض",
    phone: "+966 500 000 000",
    email: "info@levelup.edu.sa",
    website: "www.levelup.edu.sa",
    academicYears: [
        { id: "1", year: "2023-2024", isCurrent: false },
        { id: "2", year: "2024-2025", isCurrent: true },
    ],
};
