import React, { useState } from 'react';
import { ref, push } from '../../config/firebase';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Star, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface TestimonialFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestimonialForm: React.FC<TestimonialFormProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to submit a review');
      return;
    }

    setLoading(true);
    try {
      const testimonialsRef = ref(database, 'testimonials');
      await push(testimonialsRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userEmail: currentUser.email,
        userImage: currentUser.profileImage || '',
        title: formData.title,
        content: formData.content,
        rating: formData.rating,
        isApproved: false,
        createdAt: new Date().toISOString(),
      });

      toast.success('Thank you for your review! It will be published after approval.');
      setFormData({ title: '', content: '', rating: 5 });
      onClose();
    } catch (error) {
      toast.error('Failed to submit review');
      console.error('Error submitting testimonial:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Share Your Experience</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Review Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-0 focus:border-gray-500 dark:focus:border-gray-400 bg-transparent dark:text-white"
              placeholder="Give your review a title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Your Review
            </label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-0 focus:border-gray-500 dark:focus:border-gray-400 bg-transparent dark:text-white"
              placeholder="Tell us about your experience..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 flex items-center justify-center
                bg-neutral-200 dark:bg-neutral-700
                text-neutral-900 dark:text-neutral-200
                py-2 px-4 rounded-lg font-medium
                hover:bg-neutral-300 dark:hover:bg-neutral-600
                transition-colors duration-200
                focus:outline-none focus:ring-0
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                flex-1 flex items-center justify-center
                bg-neutral-900 dark:bg-neutral-100
                text-neutral-100 dark:text-neutral-900
                py-2 px-4 rounded-lg font-medium
                hover:bg-neutral-800 dark:hover:bg-neutral-200
                transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-0
              "
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  Submit
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestimonialForm;