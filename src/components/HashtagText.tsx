import React from 'react';
import { Text, TextStyle } from 'react-native';
import theme from '../styles/theme';

interface HashtagTextProps {
  text: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export default function HashtagText({ text, style, numberOfLines }: HashtagTextProps) {
  // Function to split text and identify hashtags
  const renderTextWithHashtags = () => {
    // Only match hashtags followed by space or punctuation (NOT end of string)
    const hashtagRegex = /#[a-zA-Z0-9_]+(?=\s|[.,!?;:\n\r])/g;
    
    if (!hashtagRegex.test(text)) {
      // No hashtags found, return plain text
      return text;
    }
    
    // Reset regex for actual processing
    hashtagRegex.lastIndex = 0;
    
    const result = [];
    let lastIndex = 0;
    let match;
    
    while ((match = hashtagRegex.exec(text)) !== null) {
      // Add text before the hashtag
      if (match.index > lastIndex) {
        result.push(
          <Text key={`text-${lastIndex}`} style={style}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }
      
      // Add the hashtag with blue styling
      result.push(
        <Text 
          key={`hashtag-${match.index}`} 
          style={[style, { color: theme.colors.primary, fontWeight: '500' }]}
        >
          {match[0]}
        </Text>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last hashtag
    if (lastIndex < text.length) {
      result.push(
        <Text key={`text-${lastIndex}`} style={style}>
          {text.substring(lastIndex)}
        </Text>
      );
    }
    
    return result;
  };

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {renderTextWithHashtags()}
    </Text>
  );
} 