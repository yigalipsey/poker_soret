import {
  getPlayerSession,
  getClubSession,
  getClub,
  getUserClubs,
} from "../actions";
import ProfileContent from "@/components/ProfileContent";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // בדוק אם יש club_session - חייב להיות מחובר למועדון
  const clubSession = await getClubSession();

  const currentUser = await getPlayerSession();

  // If no user logged in, ProfileContent will show login form
  let userClubs = [];
  if (currentUser) {
    userClubs = await getUserClubs(currentUser._id);
  }

  return (
    <ProfileContent
      currentUser={currentUser}
      userClubs={userClubs}
      hasClubSession={!!clubSession}
    />
  );
}
