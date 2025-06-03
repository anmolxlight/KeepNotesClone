import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Note, KEEP_COLORS } from '../types';
import theme from '../styles/theme';
import HashtagText from './HashtagText';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
  onPin: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - theme.spacing.md * 3) / 2;

export default function NoteCard({ note, onPress, onDelete, onColorChange, onPin }: NoteCardProps) {
  const noteColor = KEEP_COLORS.find(color => color.value === note.color);
  const backgroundColor = noteColor?.value || theme.colors.cardBackground;
  
  // Determine text color based on background
  const isLightBackground = backgroundColor === '#ffffff' || 
    backgroundColor === '#fff475' || 
    backgroundColor === '#ccff90' || 
    backgroundColor === '#a7ffeb' ||
    backgroundColor === '#cbf0f8' ||
    backgroundColor === '#e6c9a8';
  
  const textColor = isLightBackground ? '#3c4043' : theme.colors.onSurface;
  const secondaryTextColor = isLightBackground ? '#5f6368' : theme.colors.secondaryText;

  const handleLongPress = () => {
    // Handle long press for additional options
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor, width: cardWidth }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Pin indicator */}
      {note.isPinned && (
        <View style={styles.pinContainer}>
          <Ionicons
            name="pin"
            size={16}
            color={secondaryTextColor}
            style={styles.pinIcon}
          />
        </View>
      )}

      {/* Images */}
      {note.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: note.images[0] }}
            style={styles.noteImage}
            resizeMode="cover"
          />
          {note.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{note.images.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* Title */}
      {note.title.trim() !== '' && (
        <HashtagText
          text={truncateText(note.title, 60)}
          style={[styles.title, { color: textColor }]}
          numberOfLines={2}
        />
      )}

      {/* Content */}
      {note.content.trim() !== '' && (
        <HashtagText
          text={truncateText(note.content, 120)}
          style={[styles.content, { color: secondaryTextColor }]}
          numberOfLines={4}
        />
      )}

      {/* Audio indicator */}
      {note.audioUri && (
        <View style={styles.audioContainer}>
          <Ionicons
            name="mic"
            size={16}
            color={secondaryTextColor}
            style={styles.audioIcon}
          />
          <Text style={[styles.audioText, { color: secondaryTextColor }]}>
            Audio note
          </Text>
        </View>
      )}

      {/* Labels */}
      {note.labels.length > 0 && (
        <View style={styles.labelsContainer}>
          {note.labels.slice(0, 3).map((label, index) => (
            <View key={index} style={[styles.labelChip, { borderColor: secondaryTextColor }]}>
              <Text style={[styles.labelText, { color: secondaryTextColor }]}>
                {label}
              </Text>
            </View>
          ))}
          {note.labels.length > 3 && (
            <Text style={[styles.moreLabelsText, { color: secondaryTextColor }]}>
              +{note.labels.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Bottom actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            // Cycle through a few popular colors
            const colors = ['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa'];
            const currentIndex = colors.indexOf(note.color || '#ffffff');
            const nextIndex = (currentIndex + 1) % colors.length;
            onColorChange(colors[nextIndex]);
          }}
        >
          <Ionicons
            name="color-palette-outline"
            size={18}
            color={secondaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={secondaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onPin();
          }}
        >
          <Ionicons
            name={note.isPinned ? "pin" : "pin-outline"}
            size={18}
            color={secondaryTextColor}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    minHeight: 120,
    maxHeight: 240,
    flex: 1,
  },

  pinContainer: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 1,
  },

  pinIcon: {
    transform: [{ rotate: '45deg' }],
  },

  imageContainer: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },

  noteImage: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.sm,
  },

  imageCountBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },

  imageCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },

  title: {
    ...theme.typography.body1,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },

  content: {
    ...theme.typography.body2,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },

  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  audioIcon: {
    marginRight: theme.spacing.xs,
  },

  audioText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
  },

  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },

  labelChip: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  labelText: {
    ...theme.typography.caption,
    fontSize: 11,
  },

  moreLabelsText: {
    ...theme.typography.caption,
    fontSize: 11,
    alignSelf: 'center',
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },

  actionButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    minWidth: 32,
    alignItems: 'center',
  },
}); 