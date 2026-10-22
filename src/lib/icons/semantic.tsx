import React from "react";
import type { IconComponent } from "./types.ts";
import {
  Search as LucideSearch,
  ShoppingCart as LucideCart,
  Compass as LucideExplore,
  LayoutGrid as LucideCategories,
  Tag as LucideSell,
  Menu as LucideMenu,
  X as LucideClose,
  Sun as LucideThemeLight,
  Moon as LucideThemeDark,
  Sparkles as LucideMagic,
  ChevronRight as LucideNext,
  ChevronLeft as LucideBack,
  Home as LucideHome,
  Send as LucideSend,
  CheckCircle2 as LucideSuccess,
  ShieldCheck as LucideSecurity,
  Zap as LucidePerformance,
  Star as LucideRating,
  BadgeCheck as LucideVerified,
  AlertTriangle as LucideServerError,
  SearchX as LucideNoResults,
  Check as LucideCheck,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
  Lock as LucideLock,
  Mail as LucideMail,
  User as LucideUser,
  LayoutDashboard as LucideLayoutDashboard,
  Download as LucideDownload,
  Package as LucidePackage,
  TrendingUp as LucideTrendingUp,
  CreditCard as LucideCreditCard,
  Settings as LucideSettings,
  Heart as LucideHeart,
  Bell as LucideBell,
  LogOut as LucideLogOut,
  ExternalLink as LucideExternalLink,
  FileText as LucideFileText,
  Plus as LucidePlus,
  Upload as LucideUpload,
  Image as LucideImage,
  Edit as LucideEdit,
  Layers as LucideLayers,
  UploadCloud as LucideUploadCloud,
  Boxes as LucideBoxes,
  AlertCircle as LucideAlertCircle,
  Wallet as LucideWallet,
  BarChart3 as LucideBarChart3,
  Library as LucideLibrary,
  KeyRound as LucideKeyRound,
  ShoppingBag as LucideShoppingBag,
  Receipt as LucideReceipt,
  RotateCcw as LucideRotateCcw,
  Shield as LucideShield,
  Store as LucideStore,
  Trash2 as LucideTrash2,
  HelpCircle as LucideHelpCircle,
  ChevronDown as LucideChevronDown,
  Copy as LucideCopy,
  Link as LucideLink,
  Share2 as LucideShare,
} from "lucide-react";

import type { LucideProps } from "lucide-react";

function createSemanticIcon(LucideIcon: React.ComponentType<LucideProps>): IconComponent {
  const Component: IconComponent = ({
    size = 20,
    strokeWidth = 2,
    className = "",
    ...props
  }) => (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
  return Component;
}

// Semantic UI Icons conforming to IconProps
export const Search: IconComponent = createSemanticIcon(LucideSearch);
export const Cart: IconComponent = createSemanticIcon(LucideCart);
export const Explore: IconComponent = createSemanticIcon(LucideExplore);
export const Categories: IconComponent = createSemanticIcon(LucideCategories);
export const Sell: IconComponent = createSemanticIcon(LucideSell);
export const Menu: IconComponent = createSemanticIcon(LucideMenu);
export const Close: IconComponent = createSemanticIcon(LucideClose);
export const ThemeLight: IconComponent = createSemanticIcon(LucideThemeLight);
export const ThemeDark: IconComponent = createSemanticIcon(LucideThemeDark);
export const Magic: IconComponent = createSemanticIcon(LucideMagic);
export const Next: IconComponent = createSemanticIcon(LucideNext);
export const Back: IconComponent = createSemanticIcon(LucideBack);
export const Home: IconComponent = createSemanticIcon(LucideHome);
export const Send: IconComponent = createSemanticIcon(LucideSend);
export const Success: IconComponent = createSemanticIcon(LucideSuccess);
export const Security: IconComponent = createSemanticIcon(LucideSecurity);
export const Performance: IconComponent = createSemanticIcon(LucidePerformance);
export const Rating: IconComponent = createSemanticIcon(LucideRating);
export const Verified: IconComponent = createSemanticIcon(LucideVerified);
export const ServerError: IconComponent = createSemanticIcon(LucideServerError);
export const NoResults: IconComponent = createSemanticIcon(LucideNoResults);
export const Check: IconComponent = createSemanticIcon(LucideCheck);
export const Eye: IconComponent = createSemanticIcon(LucideEye);
export const EyeOff: IconComponent = createSemanticIcon(LucideEyeOff);
export const Lock: IconComponent = createSemanticIcon(LucideLock);
export const Mail: IconComponent = createSemanticIcon(LucideMail);
export const User: IconComponent = createSemanticIcon(LucideUser);
export const LayoutDashboard: IconComponent = createSemanticIcon(LucideLayoutDashboard);
export const Dashboard: IconComponent = LayoutDashboard;
export const Download: IconComponent = createSemanticIcon(LucideDownload);
export const Package: IconComponent = createSemanticIcon(LucidePackage);
export const TrendingUp: IconComponent = createSemanticIcon(LucideTrendingUp);
export const Analytics: IconComponent = TrendingUp;
export const CreditCard: IconComponent = createSemanticIcon(LucideCreditCard);
export const Settings: IconComponent = createSemanticIcon(LucideSettings);
export const Heart: IconComponent = createSemanticIcon(LucideHeart);
export const Bell: IconComponent = createSemanticIcon(LucideBell);
export const LogOut: IconComponent = createSemanticIcon(LucideLogOut);
export const SignOut: IconComponent = LogOut;
export const Signout: IconComponent = LogOut;
export const ExternalLink: IconComponent = createSemanticIcon(LucideExternalLink);
export const FileText: IconComponent = createSemanticIcon(LucideFileText);
export const Plus: IconComponent = createSemanticIcon(LucidePlus);
export const Upload: IconComponent = createSemanticIcon(LucideUpload);
export const Image: IconComponent = createSemanticIcon(LucideImage);
export const Edit: IconComponent = createSemanticIcon(LucideEdit);
export const Layers: IconComponent = createSemanticIcon(LucideLayers);
export const UploadCloud: IconComponent = createSemanticIcon(LucideUploadCloud);
export const Boxes: IconComponent = createSemanticIcon(LucideBoxes);
export const AlertCircle: IconComponent = createSemanticIcon(LucideAlertCircle);
export const Wallet: IconComponent = createSemanticIcon(LucideWallet);
export const BarChart3: IconComponent = createSemanticIcon(LucideBarChart3);
export const Library: IconComponent = createSemanticIcon(LucideLibrary);
export const KeyRound: IconComponent = createSemanticIcon(LucideKeyRound);
export const ShoppingBag: IconComponent = createSemanticIcon(LucideShoppingBag);
export const Receipt: IconComponent = createSemanticIcon(LucideReceipt);
export const RotateCcw: IconComponent = createSemanticIcon(LucideRotateCcw);
export const Shield: IconComponent = createSemanticIcon(LucideShield);
export const Store: IconComponent = createSemanticIcon(LucideStore);
export const Trash2: IconComponent = createSemanticIcon(LucideTrash2);
export const HelpCircle: IconComponent = createSemanticIcon(LucideHelpCircle);
export const ChevronDown: IconComponent = createSemanticIcon(LucideChevronDown);
export const Copy: IconComponent = createSemanticIcon(LucideCopy);
export const Link: IconComponent = createSemanticIcon(LucideLink);
export const Share: IconComponent = createSemanticIcon(LucideShare);

// Friendly aliases
export const Sun: IconComponent = ThemeLight;
export const Moon: IconComponent = ThemeDark;
export const ShoppingCart: IconComponent = Cart;
export const Sparkles: IconComponent = Magic;
export const ChevronRight: IconComponent = Next;
export const ChevronLeft: IconComponent = Back;
export const ShieldCheck: IconComponent = Security;
export const Star: IconComponent = Rating;
export const Tag: IconComponent = Sell;
export const Compass: IconComponent = Explore;
export const ShareLink: IconComponent = Link;
