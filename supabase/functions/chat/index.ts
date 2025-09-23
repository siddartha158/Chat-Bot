import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatId, projectId, systemPrompt } = await req.json();
    
    if (!message || !chatId || !projectId) {
      throw new Error('Missing required fields');
    }

    const openAIApiKey = "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"
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get chat history for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(20); // Limit to last 20 messages for context

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Prepare conversation history
    const conversation = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' }
    ];

    // Add previous messages if available
    if (messages) {
      conversation.push(...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add current user message
    conversation.push({ role: 'user', content: message });

    console.log('Sending request to OpenAI with conversation:', conversation);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversation,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ content: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
