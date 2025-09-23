import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../stores/authStore";
import CommentField from "./comment-field.component";
import CommentCard from "./comment-card.component";
import Loader from "./loader.component";

const Comments = ({ blog }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
  const { user, isAuthenticated } = useAuthStore();

  const { _id: blog_id, activity: { total_parent_comments } = {} } = blog;

  useEffect(() => {
    if (blog_id) {
      fetchComments({ skip: 0 });
    }
  }, [blog_id]);

  const fetchComments = async ({ skip = 0, createNewArr = false }) => {
    let res;
    setLoading(true);

    try {
      res = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/get-blog-comments`,
        { blog_id, skip }
      );

      res.data.map((comment) => {
        comment.childrenLevel = 0;
      });

      setComments(createNewArr ? res.data : [...comments, ...res.data]);

      setTotalParentCommentsLoaded(
        createNewArr
          ? res.data.length
          : totalParentCommentsLoaded + res.data.length
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const loadMoreComments = async () => {
    fetchComments({ skip: totalParentCommentsLoaded, createNewArr: false });
  };

  return (
    <div className="w-screen max-w-[800px] py-10">
      <div className="text-xl font-medium">Comments</div>

      {isAuthenticated ? (
        <CommentField
          action="comment"
          blog={blog}
          setParentCommentCountFun={setTotalParentCommentsLoaded}
          replyingTo={undefined}
          setReplying={undefined}
          onCommentAdded={() => fetchComments({ skip: 0, createNewArr: true })}
        />
      ) : (
        <div className="border border-grey p-5 bg-white rounded-md my-8">
          <p className="text-lg text-dark-grey text-center">
            <a href="/signin" className="underline text-black text-xl ml-1">
              Sign in
            </a>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {comments && comments.length ? (
        comments.map((comment, i) => {
          return (
            <CommentCard
              key={i}
              index={i}
              leftVal={comment.childrenLevel * 4}
              commentData={comment}
              blog={blog}
            />
          );
        })
      ) : (
        <div className="text-center text-dark-grey py-8">No comments yet</div>
      )}

      {total_parent_comments > totalParentCommentsLoaded ? (
        <button
          onClick={loadMoreComments}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader /> : "Load More"}
        </button>
      ) : null}
    </div>
  );
};

export default Comments;
