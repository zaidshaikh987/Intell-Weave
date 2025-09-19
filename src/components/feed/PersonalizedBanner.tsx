import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { UserProfile as UserProfileEntity, UserProfileType } from '@/entities/all';
import { User } from '@/entities/User';
import { Sparkles, Settings, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Input from '@/components/ui/input';

const POPULAR_TOPICS = [
  'Technology', 'Politics', 'Business', 'Science', 'Health',
  'Sports', 'Entertainment', 'Climate', 'Education', 'Finance'
];

export default function PersonalizedBanner({ user, userProfile, onUpdatePreferences }: {
  user: { email: string; full_name?: string } | null;
  userProfile: UserProfileType | null;
  onUpdatePreferences: () => void;
}) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(userProfile?.preferred_topics || []);
  const [customTopic, setCustomTopic] = useState('');

  const addTopic = (topic: string) => {
    if (!selectedTopics.includes(topic)) setSelectedTopics([...selectedTopics, topic]);
  };
  const removeTopic = (topic: string) => setSelectedTopics(selectedTopics.filter(t => t !== topic));
  const addCustomTopic = () => {
    const t = customTopic.trim();
    if (t && !selectedTopics.includes(t)) addTopic(t);
    setCustomTopic('');
  };

  const savePreferences = async () => {
    try {
      if (!user) return;
      if (userProfile) {
        await UserProfileEntity.update(userProfile.id, { preferred_topics: selectedTopics });
      } else {
        await UserProfileEntity.create({ preferred_topics: selectedTopics, reading_preferences: { audio_enabled: false, summary_length: 'medium', language: 'en', notification_frequency: 'daily' }, created_by: user.email });
      }
      setShowPreferences(false);
      onUpdatePreferences();
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  };

  if (!user) {
    return (
      <Card className="mb-6 border border-black bg-gradient-to-r from-emerald-100 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-black mb-2">Welcome to Intell Weave</h2>
              <p className="text-gray-600">Sign in to get personalized news recommendations based on your interests</p>
            </div>
            <Button onClick={() => User.login()} className="bg-green-600 hover:bg-green-700 text-white border border-black">Sign In</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border border-black bg-gradient-to-r from-emerald-100 to-blue-100">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-black">{userProfile?.preferred_topics?.length ? 'Your Personalized Feed' : 'Get Started'}</h2>
            </div>
            {userProfile?.preferred_topics?.length ? (
              <div>
                <p className="text-gray-700 mb-3">
                  Based on your interests in {userProfile.preferred_topics.slice(0,3).join(', ')}
                  {userProfile.preferred_topics.length > 3 && ` and ${userProfile.preferred_topics.length - 3} more topics`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {userProfile.preferred_topics.slice(0,5).map((topic, i) => (
                    <Badge key={i} className="bg-emerald-200 text-emerald-800 border border-black">{topic}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-700">Set your topic preferences to get personalized article recommendations</p>
            )}
          </div>

          <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border border-black">
                <Settings className="w-4 h-4 mr-2" />
                {userProfile?.preferred_topics?.length ? 'Edit Preferences' : 'Set Preferences'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customize Your Feed</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Popular Topics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {POPULAR_TOPICS.map((topic) => (
                      <motion.button
                        key={topic}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectedTopics.includes(topic) ? removeTopic(topic) : addTopic(topic)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all border border-black ${selectedTopics.includes(topic) ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {topic}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Add Custom Topic</h4>
                  <div className="flex gap-2">
                    <Input value={customTopic} onChange={e=>setCustomTopic(e.target.value)} placeholder="Enter a topic you're interested in..." className="border border-black" />
                    <Button onClick={addCustomTopic} variant="outline" className="border border-black">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedTopics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Your Selected Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopics.map((topic, index) => (
                        <Badge key={index} className="bg-emerald-200 text-emerald-800 border border-black pr-1">
                          {topic}
                          <button onClick={() => removeTopic(topic)} className="ml-2 rounded-full p-1 hover:bg-emerald-300">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowPreferences(false)} className="border border-black">Cancel</Button>
                  <Button onClick={savePreferences} className="bg-emerald-600 hover:bg-emerald-700 text-white border border-black">Save Preferences</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
