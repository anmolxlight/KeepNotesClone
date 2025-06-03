const AsyncStorage = require('@react-native-async-storage/async-storage');

// Function to extract valid hashtags from text
const extractValidHashtags = (text) => {
  // Only match hashtags followed by space or punctuation (NOT end of string)
  const hashtagRegex = /#([a-zA-Z0-9_]+)(?=\s|[.,!?;:\n\r])/g;
  const matches = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return [...new Set(matches)];
};

// Function to clean up incomplete labels
const cleanupIncompleteLabels = async () => {
  try {
    console.log('🧹 Cleaning up incomplete hashtag labels...');
    
    const storedNotes = await AsyncStorage.getItem('notes');
    if (!storedNotes) {
      console.log('No notes found');
      return;
    }
    
    const notes = JSON.parse(storedNotes);
    let cleanedCount = 0;
    
    const cleanedNotes = notes.map(note => {
      const allText = `${note.title} ${note.content}`;
      const validLabels = extractValidHashtags(allText);
      
      // Keep only labels that are either valid hashtags or don't appear as partial hashtags
      const filteredLabels = note.labels.filter(label => {
        // If it's a valid complete hashtag, keep it
        if (validLabels.includes(label)) {
          return true;
        }
        
        // Check if this label is a substring of any valid hashtag (incomplete)
        const isIncomplete = validLabels.some(validLabel => 
          validLabel.startsWith(label) && validLabel !== label
        );
        
        // Keep if it's not incomplete (could be manually added)
        return !isIncomplete;
      });
      
      if (note.labels.length !== filteredLabels.length) {
        cleanedCount++;
        console.log(`📝 Cleaned note "${note.title || 'Untitled'}": ${note.labels.length} → ${filteredLabels.length} labels`);
      }
      
      return {
        ...note,
        labels: filteredLabels,
        updatedAt: new Date().toISOString()
      };
    });
    
    await AsyncStorage.setItem('notes', JSON.stringify(cleanedNotes));
    console.log(`✅ Cleanup complete! Cleaned ${cleanedCount} notes.`);
    
  } catch (error) {
    console.error('❌ Error cleaning up labels:', error);
  }
};

// Run the cleanup
cleanupIncompleteLabels(); 