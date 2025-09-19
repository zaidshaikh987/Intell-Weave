import React, { useState } from 'react';
import MediaViewer from '@/components/multimodal/MediaViewer';
import { Play, Image, Headphones, Upload, Mic, Video } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>('images');

  // Sample media data - in real app, this would come from API
  const sampleMedia = {
    images: [
      {
        id: 1,
        url: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=News+Image+1',
        title: 'Breaking: Climate Summit Results',
        description: 'World leaders reach historic agreement on carbon emissions',
        type: 'image',
        metadata: { width: 400, height: 300, size: '125KB' }
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Tech+News',
        title: 'AI Revolution in Healthcare',
        description: 'New AI system diagnoses diseases with 95% accuracy',
        type: 'image',
        metadata: { width: 400, height: 300, size: '98KB' }
      }
    ],
    videos: [
      {
        id: 3,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        title: 'Economic Outlook 2024',
        description: 'Expert analysis of global economic trends',
        type: 'video',
        metadata: { duration: '5:32', size: '12MB', resolution: '1280x720' }
      }
    ],
    audio: [
      {
        id: 4,
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        title: 'Daily News Briefing',
        description: 'AI-generated audio summary of today\'s top stories',
        type: 'audio',
        metadata: { duration: '3:45', size: '2.1MB', format: 'MP3' }
      }
    ]
  };

  const currentMedia = sampleMedia[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Play className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Media Center</h1>
                <p className="text-gray-600 mt-1">Explore images, videos, and audio content from news articles</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                <Mic className="w-4 h-4 mr-2" />
                Generate Audio
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Media Types</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveTab('images')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    activeTab === 'images' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Image className="w-5 h-5" />
                  <span className="font-medium">Images</span>
                  <span className="ml-auto text-sm text-gray-500">{sampleMedia.images.length}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    activeTab === 'videos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Videos</span>
                  <span className="ml-auto text-sm text-gray-500">{sampleMedia.videos.length}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    activeTab === 'audio' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Headphones className="w-5 h-5" />
                  <span className="font-medium">Audio</span>
                  <span className="ml-auto text-sm text-gray-500">{sampleMedia.audio.length}</span>
                </button>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="bg-white mt-6">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">AI Features</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Text-to-Speech</h4>
                  <p className="text-sm text-green-600 mt-1">Convert articles to audio briefings</p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Image Analysis</h4>
                  <p className="text-sm text-blue-600 mt-1">Extract text and analyze content</p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">Video Processing</h4>
                  <p className="text-sm text-purple-600 mt-1">Generate summaries and clips</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedMedia ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <MediaViewer media={selectedMedia} currentIndex={0} onClose={function (): void {
                                  throw new Error('Function not implemented.');
                              } } onIndexChange={function (index: number): void {
                                  throw new Error('Function not implemented.');
                              } } />
                <div className="mt-4 flex justify-between items-center">
                  <Button 
                    onClick={() => setSelectedMedia(null)}
                    className="bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Back to Gallery
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">{activeTab}</h2>
                  <span className="text-sm text-gray-500">{currentMedia.length} items</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentMedia.map((item) => (
                    <Card key={item.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4" onClick={() => setSelectedMedia(item)}>
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          {activeTab === 'images' && <Image className="w-12 h-12 text-gray-400" />}
                          {activeTab === 'videos' && <Video className="w-12 h-12 text-gray-400" />}
                          {activeTab === 'audio' && <Headphones className="w-12 h-12 text-gray-400" />}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{item.metadata.size}</span>
                          {'duration' in item.metadata && <span>{item.metadata.duration}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {currentMedia.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'images' && <Image className="w-8 h-8 text-gray-400" />}
                      {activeTab === 'videos' && <Video className="w-8 h-8 text-gray-400" />}
                      {activeTab === 'audio' && <Headphones className="w-8 h-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
                    <p className="text-gray-600">Upload some media files to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
