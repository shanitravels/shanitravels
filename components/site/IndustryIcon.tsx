import {
  FaPlane,
  FaLandmark,
  FaBuilding,
  FaFlag,
  FaHandsHelping,
  FaGlobeAsia,
  FaOilCan,
  FaSignal,
  FaHardHat,
  FaUniversity,
  FaSchool,
  FaUsers,
  FaBriefcase,
} from "react-icons/fa";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  plane: FaPlane,
  landmark: FaLandmark,
  building: FaBuilding,
  flag: FaFlag,
  hands: FaHandsHelping,
  globe: FaGlobeAsia,
  oil: FaOilCan,
  signal: FaSignal,
  hardhat: FaHardHat,
  bank: FaUniversity,
  school: FaSchool,
  family: FaUsers,
};

/** Maps the CMS icon string to an icon component (briefcase fallback). */
export function IndustryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || FaBriefcase;
  return <Icon className={className} />;
}
