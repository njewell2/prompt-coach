import {
  Zap, Target, Trophy, Flag, CheckCircle2, Lock, PlayCircle,
  ShieldCheck, BarChart3, FileText, GraduationCap, Sparkles,
  TrendingUp, ArrowRight, ArrowLeft, X, AlertCircle, KeyRound,
  Users, Presentation, ChevronRight, Lightbulb, Eye, LogOut,
  Home, MessageSquare, Award,
  type LucideProps,
} from 'lucide-react'

type IconComponent = (props: LucideProps) => JSX.Element

function wrap(Comp: any): IconComponent {
  return ({ size = 16, strokeWidth = 1.75, ...rest }: LucideProps) => (
    <Comp size={size} strokeWidth={strokeWidth} {...rest} />
  )
}

export const Icon = {
  Zap:            wrap(Zap),
  Target:         wrap(Target),
  Trophy:         wrap(Trophy),
  Flag:           wrap(Flag),
  CheckCircle:    wrap(CheckCircle2),
  Lock:           wrap(Lock),
  Play:           wrap(PlayCircle),
  Shield:         wrap(ShieldCheck),
  Chart:          wrap(BarChart3),
  File:           wrap(FileText),
  Grad:           wrap(GraduationCap),
  Sparkles:       wrap(Sparkles),
  Trend:          wrap(TrendingUp),
  ArrowRight:     wrap(ArrowRight),
  ArrowLeft:      wrap(ArrowLeft),
  Close:          wrap(X),
  Alert:          wrap(AlertCircle),
  Key:            wrap(KeyRound),
  Users:          wrap(Users),
  Projector:      wrap(Presentation),
  ChevronRight:   wrap(ChevronRight),
  Lightbulb:      wrap(Lightbulb),
  Eye:            wrap(Eye),
  Logout:         wrap(LogOut),
  Home:           wrap(Home),
  Message:        wrap(MessageSquare),
  Award:          wrap(Award),
}

export type { LucideProps as IconProps }
