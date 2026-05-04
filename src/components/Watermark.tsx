import somisteamLogo from "@/assets/somisteam-logo.jpg";

const Watermark = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <img
        src={somisteamLogo}
        alt=""
        aria-hidden="true"
        className="w-[500px] max-w-[80vw] opacity-[0.04] select-none"
        draggable={false}
      />
    </div>
  );
};

export default Watermark;
