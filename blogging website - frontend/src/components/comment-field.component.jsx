import { useState } from "react";
import axios from "axios";
import useAuthStore from "../stores/authStore";

const CommentField = ({
  action,
  blog,
  setParentCommentCountFun,
  replyingTo,
  setReplying,
}) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const {
    _id: blog_id,
    author: { _id: blog_author } = {},
  } = blog;

  const handleComment = async () => {
    if (!comment.length) {
      return alert("Write something to leave a comment...");
    }

    setLoading(true);

    const commentObj = {
      _id: blog_id,
      blog_author,
      comment,
      replying_to: replyingTo,
    };

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`,
        commentObj
      );

      setComment("");

      if (replyingTo) {
        setReplying(false);
      } else {
        setParentCommentCountFun((preVal) => preVal + 1);
      }
    } catch (err) {
      console.log(err.message);
    }

    setLoading(false);
  };

  return (
    <>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
      />

      <button
        className="btn-dark mt-5 px-10"
        onClick={handleComment}
        disabled={loading}
      >
        {loading ? "Publishing..." : action}
      </button>
    </>
  );
};

export default CommentField;