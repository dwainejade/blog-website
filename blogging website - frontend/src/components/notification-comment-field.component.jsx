import { useState } from "react";

const NotificationCommentField = ({ notification, onReply }) => {
  const [reply, setReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setLoading(true);
    try {
      await onReply(reply);
      setReply("");
      setIsReplying(false);
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setLoading(false);
    }
  };

  if (notification.type === "like") {
    return null; // No reply option for likes
  }

  return (
    <div className="mt-4 pt-4 border-t border-grey">
      {!isReplying ? (
        <button
          onClick={() => setIsReplying(true)}
          className="text-sm text-blue hover:underline"
        >
          Reply
        </button>
      ) : (
        <form onSubmit={handleReply} className="space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-3 border border-grey rounded resize-none"
            rows="3"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!reply.trim() || loading}
              className="btn-dark text-sm disabled:opacity-50"
            >
              {loading ? "Sending..." : "Reply"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReply("");
              }}
              className="btn-light text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NotificationCommentField;