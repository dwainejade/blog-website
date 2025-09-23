import { useState } from "react";
import axios from "axios";
import useAuthStore from "../stores/authStore";
import { formatDate } from "../common/date";
import CommentField from "./comment-field.component";

const CommentCard = ({ index, leftVal, commentData, blog }) => {
  let {
    commented_by: {
      personal_info: { profile_img, fullname, username: commented_by_username },
    },
    commentedAt,
    comment,
    _id,
    children,
  } = commentData;

  const [isReplying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoaded, setRepliesLoaded] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const { user, isAuthenticated } = useAuthStore();

  const getDay = (timestamp) => {
    return formatDate(timestamp);
  };

  const loadReplies = async ({ skip = 0, createNewArr = false }) => {
    if (children.length) {
      try {
        const {
          data: { replies },
        } = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/get-replies`,
          { _id, skip }
        );

        replies.map((reply) => {
          reply.childrenLevel = commentData.childrenLevel + 1;
        });

        setReplies(createNewArr ? replies : [...replies, ...replies]);
        setRepliesLoaded(
          createNewArr ? replies.length : repliesLoaded + replies.length
        );
      } catch (err) {
        console.log(err);
      }
    }
  };

  const deleteComment = async (e) => {
    e.target.setAttribute("disabled", true);

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      e.target.removeAttribute("disabled");
      return;
    }

    setDeleting(true);

    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`,
        {
          data: { _id },
        }
      );

      setDeleted(true);
      e.target.removeAttribute("disabled");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Failed to delete comment");
      e.target.removeAttribute("disabled");
    }

    setDeleting(false);
  };

  const hideReplies = () => {
    setShowReplies(false);
  };

  const showRepliesHandler = () => {
    if (!showReplies) {
      loadReplies({ skip: 0, createNewArr: true });
    }
    setShowReplies(!showReplies);
  };

  const LoadMoreRepliesButton = () => {
    return (
      children.length - repliesLoaded > 0 && (
        <button
          onClick={() => loadReplies({ skip: repliesLoaded })}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
        >
          Load More Replies ({children.length - repliesLoaded})
        </button>
      )
    );
  };

  if (deleted) {
    return (
      <div className="w-full" style={{ paddingLeft: `${leftVal * 20}px` }}>
        <div className="my-5 p-6 bg-grey/20 border-l-2 border-grey/50">
          <p className="text-dark-grey italic">This comment has been deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pl-2">
      <div className="my-5 p-6 border-l-4 border-gray-300">
        <div className="flex gap-3 items-center mb-8">
          <img src={profile_img} className="w-6 h-6 rounded-full" />
          <p className="line-clamp-1">{fullname}</p>
          <p className="min-w-fit">{getDay(commentedAt)}</p>
        </div>

        <p className="font-gelasio text-xl ml-3">{comment}</p>

        <div className="flex gap-5 items-center mt-5">
          {isAuthenticated ? (
            <button
              className="underline"
              onClick={() => setReplying((preVal) => !preVal)}
            >
              Reply
            </button>
          ) : (
            ""
          )}

          {children && children.length ? (
            <button
              className="text-dark-grey flex items-center gap-2"
              onClick={showRepliesHandler}
            >
              <i className="fi fi-rs-comment-dots"></i>
              {children.length} {children.length === 1 ? "Reply" : "Replies"}
            </button>
          ) : (
            ""
          )}

          {/* Admin delete button */}
          {user && user.role === "admin" && (
            <button
              className="p-2 px-3 rounded-md border border-grey ml-auto hover:bg-red/30 hover:text-red flex items-center"
              onClick={deleteComment}
              disabled={deleting}
            >
              <i className="fi fi-rr-trash pointer-events-none"></i>
              {deleting ? " Deleting..." : " Delete"}
            </button>
          )}
        </div>

        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action="reply"
              blog={blog}
              setParentCommentCountFun={undefined}
              replyingTo={_id}
              setReplying={setReplying}
              onCommentAdded={() => {
                setReplying(false);
                if (showReplies) {
                  loadReplies({ skip: 0, createNewArr: true });
                }
              }}
            />
          </div>
        ) : (
          ""
        )}

        {showReplies && replies.length ? (
          <div className="mt-4">
            {replies.map((reply, i) => {
              return (
                <CommentCard
                  key={i}
                  index={i}
                  leftVal={reply.childrenLevel}
                  commentData={reply}
                  blog={blog}
                />
              );
            })}

            <LoadMoreRepliesButton />
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default CommentCard;
