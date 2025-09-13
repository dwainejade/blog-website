import { AnimatePresence, motion } from "framer-motion";

const PageAnimation = ({
  children,
  keyValue,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.5, ease: "easeOut" },
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={keyValue}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        layout
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageAnimation;
