import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';

const Settings: React.FC = () => {
  const auth = getAuth();
  const { toast } = useToast();
  const [user, setUser] = useState(auth.currentUser);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setPhoneNumber(userDoc.data().phoneNumber || '');
        }
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const handleProfileUpdate = async () => {
    if (user) {
      try {
        await updateProfile(user, { displayName });
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { phoneNumber }, { merge: true });
        toast({ title: 'Success', description: 'Profile updated successfully.' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handlePasswordChange = async () => {
    if (user && user.email && currentPassword && newPassword) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: 'Success', description: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
      } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to change password. Please check your current password.', variant: 'destructive' });
      }
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    });
  };

  if (!user) {
    return <div>Please sign in to view settings.</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <div className="w-full max-w-xl flex flex-col gap-8 p-4">
        <Accordion type="single" collapsible className="flex flex-col gap-8 w-full">
          <AccordionItem value="profile" className="!border-none">
            <Card className="p-0 rounded-2xl !border-none !shadow-none">
              <AccordionTrigger className="px-8 py-6 text-xl font-bold rounded-2xl !border-none !shadow-none !no-underline hover:!no-underline focus:!no-underline">Profile Settings</AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-2 px-8 pb-8">
                  <CardDescription className="mb-4">Update your name and phone number.</CardDescription>
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="block text-sm font-medium">Name</label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 text-base" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number</label>
                    <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-11 text-base" />
                  </div>
                  <Button onClick={handleProfileUpdate} className="w-full h-11 text-base mt-4">Save Changes</Button>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
          <AccordionItem value="password" className="!border-none">
            <Card className="p-0 rounded-2xl !border-none !shadow-none">
              <AccordionTrigger className="px-8 py-6 text-xl font-bold rounded-2xl !border-none !shadow-none !no-underline hover:!no-underline focus:!no-underline">Change Password</AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-6 pt-2 px-8 pb-8">
                  <CardDescription className="mb-4">Update your password here.</CardDescription>
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="block text-sm font-medium">Current Password</label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-11 text-base" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium">New Password</label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 text-base" />
                  </div>
                  <Button onClick={handlePasswordChange} className="w-full h-11 text-base mt-4">Change Password</Button>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
        <div className="flex justify-center pt-6">
          <Button variant="destructive" onClick={handleLogout} className="w-40 h-11 text-base">Logout</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;