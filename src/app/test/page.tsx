"use client";
import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { setPersonalityResult } from "@/lib/store";
import {
  PERSONALITY_QUESTIONS,
  PERSONALITY_TYPES,
  calculatePersonality,
} from "@/lib/personality";
import { ProcrastinationType } from "@/lib/types";
import { PageTransition } from "@/components/Animations";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { ChevronRight, ChevronLeft, Check, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function TestPage() {
  const { data, update, loaded } = useAppData();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [showResult, setShowResult] = useState(false);

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  const existingResult = data.profile.personalityResult;

  if (showResult && data.profile.personalityResult) {
    const result = data.profile.personalityResult;
    const info = PERSONALITY_TYPES[result.type];
    const radarData = (Object.keys(result.scores) as ProcrastinationType[]).map((key) => ({
      type: PERSONALITY_TYPES[key].name,
      score: result.scores[key],
    }));

    return (
      <PageTransition>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-6xl mb-4">{info.emoji}</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">{info.name}</h1>
          <p className="text-dark-300 text-sm leading-relaxed">{result.description}</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">人格分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="type" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 16]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3">你的特征</h3>
          <div className="space-y-2">
            {result.traits.map((trait, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-dark-300">
                <span className="text-accent-400 mt-0.5">•</span>
                <span>{trait}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3">破解建议</h3>
          <div className="space-y-2">
            {result.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-dark-300">
                <span className="text-accent-400 font-bold mt-0.5">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setAnswers([]);
              setCurrentQ(0);
              setShowResult(false);
              update((prev) => setPersonalityResult(prev, null));
            }}
            className="flex-1 glass-card glass-card-hover rounded-xl py-3 text-sm text-dark-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> 重新测试
          </button>
          <Link
            href="/tasks"
            className="flex-1 rounded-xl py-3 text-sm text-white text-center bg-gradient-to-r from-accent-500 to-primary-600 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            开始管理任务 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      </PageTransition>
    );
  }

  if (existingResult && !showResult) {
    const info = PERSONALITY_TYPES[existingResult.type];
    return (
      <PageTransition>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="text-6xl mb-4">{info.emoji}</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            你是 <span className="text-gradient">{info.name}</span>
          </h1>
          <p className="text-dark-400 text-sm">{existingResult.description}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowResult(true)}
            className="flex-1 glass-card glass-card-hover rounded-xl py-3 text-sm text-dark-300 hover:text-white transition-all"
          >
            查看详细报告
          </button>
          <button
            onClick={() => {
              setAnswers([]);
              setCurrentQ(0);
              update((prev) => setPersonalityResult(prev, null));
            }}
            className="flex-1 rounded-xl py-3 text-sm text-white bg-gradient-to-r from-accent-500 to-primary-600 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> 重新测试
          </button>
        </div>
      </div>
      </PageTransition>
    );
  }

  const question = PERSONALITY_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / PERSONALITY_QUESTIONS.length) * 100;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = [optionIndex];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ < PERSONALITY_QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        const result = calculatePersonality(newAnswers);
        update((prev) => setPersonalityResult(prev, result));
        setShowResult(true);
      }
    }, 200);
  };

  return (
    <PageTransition>
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400">
          第 {currentQ + 1} / {PERSONALITY_QUESTIONS.length} 题
        </span>
        <span className="text-sm text-accent-400">{Math.round(progress)}%</span>
      </div>

      <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-500 to-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">{question.text}</h2>
        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full text-left px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-accent-500/50 hover:bg-dark-800 transition-all text-sm text-dark-300 hover:text-white group flex items-center justify-between"
            >
              <span>{option.text}</span>
              <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {currentQ > 0 && (
        <button
          onClick={() => setCurrentQ(currentQ - 1)}
          className="text-sm text-dark-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> 上一题
        </button>
      )}
    </div>
    </PageTransition>
  );
}
