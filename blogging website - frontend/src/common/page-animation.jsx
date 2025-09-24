import { AnimatePresence, motion } from "framer-motion";

const PageAnimation = ({
  children,
  keyValue,
  className = "",
  initial = { opacity: 0, y: 25, scale: 0.98 },
  animate = { opacity: 1, y: 0, scale: 1 },
  exit = { opacity: 0, y: -15, scale: 0.95 },
  transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyValue}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageAnimation;
