"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mic, Share2, Download, BookOpen, Layers, Loader2 } from 'lucide-react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [summaryFormat, setSummaryFormat] = useState('bullets');
  const [topic, setTopic] = useState('work');
  const [isRecording, setIsRecording] = useState(false);
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated cache for demo purposes
  const summaryCache = new Map();

  // Topic keywords for offline classification
  const topicKeywords = {
    work: ['meeting', 'project', 'deadline', 'client', 'report'],
    study: ['lecture', 'exam', 'homework', 'research', 'notes'],
    personal: ['goals', 'ideas', 'thoughts', 'plans', 'journal']
  };

  // Grok API summarization
  const generateGrokSummary = async (text: string, format: string, simplified: boolean) => {
    try {
      let prompt = '';
      
      if (format === 'bullets') {
        prompt = `Summarize the following text in ${simplified ? '3-5' : '5-8'} clear bullet points:\n\n${text}`;
      } else if (format === 'paragraph') {
        prompt = `Create a ${simplified ? 'brief' : 'comprehensive'} paragraph summarizing the following text:\n\n${text}`;
      } else if (format === 'qa') {
        prompt = `Generate ${simplified ? '3' : '5'} key question-answer pairs from the following text:\n\n${text}`;
      }

      // Replace this with your actual Grok API call
      const response = await fetch('YOUR_GROK_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_GROK_API_KEY'
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].text.trim();
    } catch (error) {
      console.error('Error calling Grok API:', error);
      // Fallback to offline summarization
      return generateOfflineSummary(text, format, simplified);
    }
  };

  // Offline summarization fallback
  const generateOfflineSummary = (text: string, format: string, simplified: boolean) => {
    const sentences = text.split('. ');
    const summarized = sentences
      .filter((_, i) => i % (simplified ? 3 : 2) === 0)
      .join('. ');
      
    if (format === 'bullets') {
      return summarized.split('. ').map(s => `• ${s}`).join('\n');
    }
    
    return summarized;
  };

  // Topic detection
  const detectTopic = (text: string) => {
    const words = text.toLowerCase().split(' ');
    let topicScores = { work: 0, study: 0, personal: 0 };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      keywords.forEach(keyword => {
        if (words.includes(keyword)) topicScores[topic as keyof typeof topicScores]++;
      });
    });

    return Object.entries(topicScores).reduce((a, b) => 
      //@ts-ignore
      topicScores[a] > topicScores[b] ? a : b)[0];
  };

  // Generate flashcards
  const generateFlashcards = async (text: any) => {
    try {
      // Use Grok API for intelligent flashcard generation
      const prompt = `Generate ${isSimplifiedMode ? '3' : '5'} flashcard-style question-answer pairs from this text. Format each pair as "Q: question | A: answer":\n\n${text}`;
      
      const response = await fetch('YOUR_GROK_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_GROK_API_KEY'
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const pairs = data.choices[0].text.trim().split('\n');
      
      return pairs.map((pair: string, index: number) => {
        const [question, answer] = pair.split(' | ');
        return {
          id: index,
          question: question.replace('Q: ', ''),
          answer: answer.replace('A: ', '')
        };
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      // Fallback to simple flashcard generation
      return text.split('. ').map((sentence: string, i: number) => ({
        id: i,
        question: `What is the key point #${i + 1}?`,
        answer: sentence
      }));
    }
  };

  // Handle text input
  const handleTextInput = (e: any) => {
    setInputText(e.target.value);
    setTopic(detectTopic(e.target.value));
  };

  // Handle voice input toggle
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would integrate with the Web Speech API
  };

  // Handle summary generation
  const handleGenerateSummary = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    const cacheKey = `${inputText}-${summaryFormat}-${isSimplifiedMode}`;
    
    try {
      let generatedSummary;
      
      if (summaryCache.has(cacheKey)) {
        generatedSummary = summaryCache.get(cacheKey);
      } else {
        generatedSummary = await generateGrokSummary(
          inputText,
          summaryFormat,
          isSimplifiedMode
        );
        summaryCache.set(cacheKey, generatedSummary);
      }
      
      setSummary(generatedSummary);
      const cards = await generateFlashcards(generatedSummary);
      setFlashcards(cards);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Handle error state
    } finally {
      setIsLoading(false);
    }
  };

  // Export summary
  const handleExport = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div>
        <div>
          <div className="flex items-center justify-between my-5">
            <h1 className="text-3xl font-black">SummarEase</h1>
            <Badge variant="secondary">{topic}</Badge>
          </div>
        </div>
        <div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Enter or paste your text here..."
                value={inputText}
                onChange={handleTextInput}
                className="min-h-[200px]"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleRecording}
                className={isRecording ? 'bg-red-100' : ''}
              >
                <Mic className={isRecording ? 'text-red-500' : ''} />
              </Button>
            </div>

            <div className="flex gap-4">
              <Select value={summaryFormat} onValueChange={setSummaryFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullets">Bullet Points</SelectItem>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                  <SelectItem value="qa">Q&A</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setIsSimplifiedMode(!isSimplifiedMode)}
              >
                {isSimplifiedMode ? 'Detailed Mode' : 'Simplified Mode'}
              </Button>

              <Button 
                onClick={handleGenerateSummary}
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </Button>
            </div>

            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="flashcards">
                  <Layers className="w-4 h-4 mr-2" />
                  Flashcards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <Card>
                  <CardContent className="pt-4">
                    <div className="min-h-[100px] whitespace-pre-line">
                      {summary}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size={"sm"} onClick={() => {}}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size={"sm"} onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flashcards">
                <div className="space-y-4">
                  {flashcards.map((card: any) => (
                    <Card key={card.id}>
                      <CardContent className="pt-4">
                        <p className="font-medium">{card.question}</p>
                        <p className="mt-2 text-gray-600">{card.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};