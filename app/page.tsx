"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mic, Share2, Download, BookOpen, Layers, Loader2 } from "lucide-react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [summaryFormat, setSummaryFormat] = useState("bullets");
  const [topic, setTopic] = useState("work");
  const [isRecording, setIsRecording] = useState(false);
  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null)

  useEffect(() => {
    const initializeSession = async () => {
      //@ts-ignore
      const ses = await window.ai.languageModel.create();
      setSession(ses)
      console.log("AI Session created");
    };

    initializeSession();
  }, []);

  // Simulated cache for demo purposes
  const summaryCache = new Map();

  // Topic keywords for offline classification
  const topicKeywords = {
    work: ["meeting", "project", "deadline", "client", "report"],
    study: ["lecture", "exam", "homework", "research", "notes"],
    personal: ["goals", "ideas", "thoughts", "plans", "journal"],
  };

  // Chrome Built In AI
  const generateSummary = async (
    text: string,
    format: string,
    simplified: boolean
  ) => {
    try {
      let prompt = "";

      if (format === "bullets") {
        prompt = `Summarize the following text in ${
          simplified ? "3-5" : "5-8"
        } clear bullet points:\n\n${text}`;
      } else if (format === "paragraph") {
        prompt = `Create a ${
          simplified ? "brief" : "comprehensive"
        } paragraph summarizing the following text:\n\n${text}`;
      } else if (format === "qa") {
        prompt = `Generate ${
          simplified ? "3" : "5"
        } key question-answer pairs from the following text:\n\n${text}`;
      }

      // Replace this with your actual Grok API call
      //@ts-ignore
      const response = await session!.prompt(prompt)
      return response;
    } catch (error) {
      console.error("Error calling gemini nano");
    }
  };

  // Topic detection
  const detectTopic = (text: string) => {
    const words = text.toLowerCase().split(" ");
    let topicScores = { work: 0, study: 0, personal: 0 };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      keywords.forEach((keyword) => {
        if (words.includes(keyword))
          topicScores[topic as keyof typeof topicScores]++;
      });
    });

    return Object.entries(topicScores).reduce((a, b) =>
      //@ts-ignore
      topicScores[a] > topicScores[b] ? a : b
    )[0];
  };

  // Generate flashcards
  const generateFlashcards = async (text: any) => {
    try {
      // Use Grok API for intelligent flashcard generation
      const prompt = `Generate ${
        isSimplifiedMode ? "3" : "5"
      } flashcard-style question-answer pairs from this text. Format each pair as "Q: question | A: answer":\n\n${text}`;

      //@ts-ignore
      const response = await await session!.prompt(prompt)
      const pairs = response.split("\n");

      return pairs.map((pair: string, index: number) => {
        const [question, answer] = pair.split(" | ");
        return {
          id: index,
          question: question.replace("Q: ", ""),
          answer: answer.replace("A: ", ""),
        };
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      // Fallback to simple flashcard generation
      return text.split(". ").map((sentence: string, i: number) => ({
        id: i,
        question: `What is the key point #${i + 1}?`,
        answer: sentence,
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
        generatedSummary = await generateSummary(
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
      console.error("Error generating summary:", error);
      // Handle error state
    } finally {
      setIsLoading(false);
    }
  };

  // Export summary
  const handleExport = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
  };

  return (
    <div className="max-w-4xl min-h-screen mx-auto p-4">
      <div className="w-full">
        <div>
          <div className="flex items-center justify-between my-5 tracking-wider">
            <h1 className="text-5xl font-black underline">Briefly</h1>
            <Badge variant="secondary">{topic}</Badge>
          </div>
        </div>
        <div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Textarea
                placeholder="Enter or paste your text here..."
                value={inputText}
                onChange={handleTextInput}
                className="min-h-[200px]"
              />
              <Button
                variant="outline"
                onClick={toggleRecording}
                className={isRecording ? "bg-red-400 hover:bg-red-400" : ""}
              >
                <Mic className="w-7 stroke-[3px]" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 grid-cols-2 gap-4 items-center h-fit w-screen!">
              <Button
                onClick={handleGenerateSummary}
                disabled={isLoading || !inputText.trim()}
                variant={"secondary"}
                size={"lg"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Summary"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsSimplifiedMode(!isSimplifiedMode)}
                size={"lg"}
              >
                {isSimplifiedMode ? "Detailed Mode" : "Simplified Mode"}
              </Button>

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
            </div>

            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">
                  <BookOpen className="w-4 h-4 mr-2 stroke-[3px]" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="flashcards">
                  <Layers className="w-4 h-4 mr-2 stroke-[3px]" />
                  Flashcards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                {summary && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="min-h-[100px] whitespace-pre-line">
                        {summary}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size={"sm"}
                          onClick={() => {}}
                        >
                          <Share2 className="w-4 h-4 mr-1 stroke-[3px]" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size={"sm"}
                          onClick={handleExport}
                        >
                          <Download className="w-4 h-4 mr-1 stroke-[3px]" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
}
