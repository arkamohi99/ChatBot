import customLogo from "../../assets/logo_image.png";

export default function SidebarLogo({ isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="flex justify-center pt-2 pb-2 flex-shrink-0">
      <img
        src={customLogo}
        alt="Eghtesad Novin Bank"
        className="w-40 object-contain" 
      />
    </div>
  );
}
